/* ── Polyfill crypto for Node.js < 19 ── */
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = require("crypto").webcrypto || require("crypto");
}

const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
require("dotenv").config();

/* ── Pure Node.js PDF text extractor — no external packages needed ── */
function extractPDFText(buffer) {
  return new Promise((resolve) => {
    try {
      const str = buffer.toString("binary");
      const textParts = [];

      /* 1. Extract all string literals from the PDF binary stream */
      /*    Handles both literal strings (...) and hex strings <...> */

      /* Decompress FlateDecode streams first */
      const zlib = require("zlib");
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let sm;
      const rawStreams = [];
      while ((sm = streamRegex.exec(str)) !== null) {
        rawStreams.push(sm[1]);
      }

      /* Try to decompress each stream and extract text operators */
      for (const raw of rawStreams) {
        try {
          const buf = Buffer.from(raw, "binary");
          let decompressed;
          try { decompressed = zlib.inflateSync(buf).toString("latin1"); }
          catch { decompressed = raw; }
          extractTextFromPDFStream(decompressed, textParts);
        } catch { /* skip broken streams */ }
      }

      /* 2. Also scan top-level content for uncompressed text */
      extractTextFromPDFStream(str, textParts);

      /* 3. Clean up and join */
      const text = textParts
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      resolve({ text });
    } catch (e) {
      resolve({ text: "" });
    }
  });
}

function extractTextFromPDFStream(content, parts) {
  /* Extract text between BT...ET blocks */
  const btEt = /BT\s*([\s\S]*?)\s*ET/g;
  let block;
  while ((block = btEt.exec(content)) !== null) {
    const inner = block[1];

    /* Match Tj, ', '' operators with literal strings */
    const tjLiteral = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|'')/g;
    let m;
    while ((m = tjLiteral.exec(inner)) !== null) {
      const decoded = decodePDFString(m[1]);
      if (decoded.trim()) parts.push(decoded);
    }

    /* Match TJ operator with array of strings */
    const tjArray = /\[([\s\S]*?)\]\s*TJ/g;
    let a;
    while ((a = tjArray.exec(inner)) !== null) {
      const arrayContent = a[1];
      const strLiterals = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let s;
      while ((s = strLiterals.exec(arrayContent)) !== null) {
        const decoded = decodePDFString(s[1]);
        if (decoded.trim()) parts.push(decoded);
      }
    }
  }

  /* Also extract hex strings <AABB...> Tj — common in font-encoded PDFs */
  const hexTj = /<([0-9a-fA-F]+)>\s*(?:Tj|')/g;
  let hm;
  while ((hm = hexTj.exec(content)) !== null) {
    const decoded = hexToText(hm[1]);
    if (decoded && decoded.trim()) parts.push(decoded);
  }
}

function decodePDFString(raw) {
  /* Handle common PDF escape sequences */
  return raw
    .replace(/\\n/g,  "\n")
    .replace(/\\r/g,  "\r")
    .replace(/\\t/g,  "\t")
    .replace(/\\b/g,  "\b")
    .replace(/\\f/g,  "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    )
    /* Strip non-printable chars but keep spaces and common punctuation */
    .replace(/[^\x20-\x7E\n\r\t]/g, " ");
}

function hexToText(hex) {
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code >= 32 && code <= 126) result += String.fromCharCode(code);
    else if (code === 10 || code === 13) result += " ";
  }
  return result;
}

const app = express();

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const PORT       = process.env.PORT       || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "SECRET123";
const MONGO_URI  = process.env.MONGO_URI;

/* ═══════════════════════════════════════════
   MIDDLEWARE
═══════════════════════════════════════════ */
app.use(cors());
app.use(express.json());
/* Serve uploaded resumes as static files */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ═══════════════════════════════════════════
   MULTER — resume uploads
═══════════════════════════════════════════ */
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

/* ═══════════════════════════════════════════
   DATABASE
═══════════════════════════════════════════ */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
  });

/* ═══════════════════════════════════════════
   USER MODEL  — NEW FIELDS ADDED
═══════════════════════════════════════════ */
const UserSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:       { type: String, required: true },
    role:           { type: String, enum: ["student", "admin"], default: "student" },
    user_id:        { type: String, unique: true, sparse: true },

    /* ── original fields ── */
    skills:         { type: String, default: "" },
    education:      { type: String, default: "" },
    experience:     { type: String, default: "" },
    preferred_role: { type: String, default: "" },

    /* ── NEW profile fields ── */
    certifications:    { type: String, default: "" },   // comma-separated list
    projects:          { type: String, default: "" },   // free-text description
    cgpa: { type: Number, default: null }, // 0-10
    internship_status: {
      type: String,
      enum: ["none", "ongoing", "completed", ""],
      default: "",
    },

    resume: {
      filename:     String,
      originalname: String,
      path:         String,
      uploadedAt:   Date,
    },
  },
  { timestamps: true }
);

UserSchema.index({ user_id: 1 });
UserSchema.index({ role: 1 });

const User = mongoose.model("User", UserSchema);

/* ═══════════════════════════════════════════
   AUTH MIDDLEWARE
═══════════════════════════════════════════ */
function auth(req, res, next) {
  const header = req.header("Authorization") || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token) return res.status(401).json({ error: "No token provided." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError"
      ? "Session expired. Please log in again."
      : "Invalid token.";
    return res.status(401).json({ error: msg });
  }
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function normalizeSkills(text) {
  return (text || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getRequiredSkills(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("full stack"))        return ["html", "css", "javascript", "react", "nodejs"];
  if (t.includes("frontend"))          return ["html", "css", "javascript", "react"];
  if (t.includes("backend"))           return ["nodejs", "express", "mongodb", "sql"];
  if (t.includes("web developer"))     return ["html", "css", "javascript", "react"];
  if (t.includes("data engineer"))     return ["python", "sql", "etl", "spark"];
  if (t.includes("data analyst"))      return ["excel", "sql", "python", "power bi"];
  if (t.includes("software engineer")) return ["java", "javascript", "dsa"];
  if (t.includes("java"))              return ["java", "spring", "sql"];
  if (t.includes("python"))            return ["python", "django", "flask"];
  if (t.includes("designer"))          return ["figma", "ui", "ux", "wireframe"];
  if (t.includes("devops"))            return ["docker", "kubernetes", "ci/cd", "linux"];
  if (t.includes("cloud"))             return ["aws", "azure", "gcp", "terraform"];
  if (t.includes("ml") || t.includes("machine learning"))
    return ["python", "ml", "tensorflow", "pandas"];
  return ["communication"];
}

/* ═══════════════════════════════════════════
   SMART MATCHING ENGINE
═══════════════════════════════════════════ */
async function generateMatches(userId) {
  const db   = mongoose.connection.db;
  const user = await User.findOne({ user_id: userId });
  if (!user) return [];

  let rawJobs = await db.collection("job_postings").find({}).limit(200).toArray();
  const seen  = new Set();
  const jobs  = rawJobs.filter((job) => {
    const key = `${(job.job_title || "").toLowerCase()}_${(job.company_name || "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  const userSkills = normalizeSkills(user.skills);
  const pref       = (user.preferred_role || "").toLowerCase();

  const matches = jobs.map((job) => {
    const required = getRequiredSkills(job.job_title);
    const matched  = required.filter((s) => userSkills.includes(s));
    const missing  = required.filter((s) => !userSkills.includes(s));
    const title    = (job.job_title || "").toLowerCase();

    const isPreferred = pref
      ? title.includes(pref) || pref.split(" ").some(w => w.length > 2 && title.includes(w))
      : false;

    let score = Math.round((matched.length / required.length) * 100);
    if (isPreferred) score = Math.min(100, score + 20);

    return {
      user_id:                  user.user_id,
      company_name:             job.company_name       || "Not Mentioned",
      job_title:                job.job_title          || "Unknown",
      location:                 job.location           || "N/A",
      salary:                   job.offered_salary_lpa || "N/A",
      openings:                 job.openings           || "N/A",
      overall_match_pct:        score,
      matched_skills:           matched.length ? matched.join(", ") : "None",
      missing_mandatory_skills: missing.length ? missing.join(", ") : "None",
      eligible:                 score >= 60 ? "Yes" : "Need More Skills",
      is_preferred_role:        isPreferred,
    };
  });

  matches.sort((a, b) => {
    if (b.is_preferred_role !== a.is_preferred_role)
      return b.is_preferred_role ? 1 : -1;
    return b.overall_match_pct - a.overall_match_pct;
  });
  matches.forEach((m, i) => { m.recommendation_rank = i + 1; });

  await db.collection("user_job_matches").deleteMany({ user_id: user.user_id });
  if (matches.length) await db.collection("user_job_matches").insertMany(matches);

  return matches;
}

/* ═══════════════════════════════════════════
   ROUTES — PUBLIC
═══════════════════════════════════════════ */

app.get("/", (req, res) => res.json({ message: "PlaceIQ API Running 🚀" }));

/* ── Register  (now accepts new fields) ── */
app.post("/auth/register", async (req, res) => {
  try {
    const {
      name, email, password,
      skills, education, experience, preferred_role,
      certifications, projects, cgpa, internship_status,
    } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required." });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: "An account with this email already exists." });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, password: hash,
      role: "student",
      user_id: "USR" + Date.now(),
      skills, education, experience, preferred_role,
      certifications:    certifications    || "",
      projects:          projects          || "",
      cgpa: cgpa != null ? Number(cgpa) : null,
      internship_status: internship_status || "none",
    });

    await generateMatches(user.user_id);
    res.status(201).json({ message: "Registered successfully!", user_id: user.user_id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

/* ── Login ── */
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "No account found with this email." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Incorrect password. Please try again." });

    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: "7d" });

    if (user.role === "student") {
      generateMatches(user.user_id).catch(err =>
        console.error("Background match generation failed:", err.message)
      );
    }

    res.json({
      token,
      user: {
        name:           user.name,
        role:           user.role,
        user_id:        user.user_id,
        skills:         user.skills         || "",
        preferred_role: user.preferred_role || "",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/* ── Jobs (public) ── */
app.get("/jobs", async (req, res) => {
  try {
    const db  = mongoose.connection.db;
    const raw = await db.collection("job_postings").find({}).limit(200).toArray();
    const seen = new Set();
    const jobs = raw.filter((j) => {
      const key = `${(j.job_title || "").toLowerCase()}_${(j.company_name || "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    res.json(jobs);
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});

/* ── Matches (public) ── */
app.get("/matches", async (req, res) => {
  try {
    const db      = mongoose.connection.db;
    const matches = await db.collection("user_job_matches").find({}).limit(50).toArray();
    res.json(matches);
  } catch {
    res.status(500).json({ error: "Failed to fetch matches." });
  }
});

/* ── Dashboard stats (public) ── */
app.get("/dashboard-stats", async (req, res) => {
  try {
    const db        = mongoose.connection.db;
    const users     = await User.countDocuments({ role: "student" });
    const jobs      = await db.collection("job_postings").countDocuments();
    const applications = await db.collection("user_job_matches").countDocuments();
    const usersData = await User.find({ role: "student" }).select("skills");
    const skillSet  = new Set();
    usersData.forEach((u) => normalizeSkills(u.skills).forEach((s) => skillSet.add(s)));
    res.json({ users, jobs, applications, skills: skillSet.size });
  } catch {
    res.status(500).json({ error: "Failed to fetch dashboard stats." });
  }
});

/* ── Skills data (public) ── */
app.get("/skills-data", async (req, res) => {
  try {
    const users    = await User.find({ role: "student" }).select("skills");
    const skillMap = {};
    users.forEach((u) =>
      normalizeSkills(u.skills).forEach((sk) => {
        skillMap[sk] = (skillMap[sk] || 0) + 1;
      })
    );
    const result = Object.entries(skillMap)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch skills data." });
  }
});

/* ── Salary data (public) ── */
app.get("/salary-data", async (req, res) => {
  try {
    const db   = mongoose.connection.db;
    const jobs = await db.collection("job_postings").find({}).toArray();
    const ranges = { "0-3 LPA": 0, "3-6 LPA": 0, "6-10 LPA": 0, "10+ LPA": 0 };
    jobs.forEach((j) => {
      const sal = Number(j.offered_salary_lpa);
      if (!sal) return;
      if (sal <= 3)       ranges["0-3 LPA"]++;
      else if (sal <= 6)  ranges["3-6 LPA"]++;
      else if (sal <= 10) ranges["6-10 LPA"]++;
      else                ranges["10+ LPA"]++;
    });
    res.json(Object.entries(ranges).map(([range, count]) => ({ range, count })));
  } catch {
    res.status(500).json({ error: "Failed to fetch salary data." });
  }
});

/* ═══════════════════════════════════════════
   ROUTES — PROTECTED (student)
═══════════════════════════════════════════ */

/* ── My Profile ── */
app.get("/my-profile", auth, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

/* ── Update Profile  (now saves new fields too) ── */
app.put("/update-profile", auth, async (req, res) => {
  try {
    const {
      name, skills, education, experience, preferred_role,
      certifications, projects, cgpa, internship_status,
    } = req.body;

    const updated = await User.findOneAndUpdate(
      { user_id: req.user.user_id },
      {
        $set: {
          name, skills, education, experience, preferred_role,
          certifications:    certifications    ?? "",
          projects:          projects          ?? "",
          cgpa: cgpa != null ? Number(cgpa) : null,
          internship_status: internship_status ?? "",
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "User not found." });

    /* Regenerate matches whenever profile changes */
    generateMatches(req.user.user_id).catch(console.error);

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

/* ── My Matches ── */
app.get("/my-matches", auth, async (req, res) => {
  try {
    const db      = mongoose.connection.db;
    const matches = await db
      .collection("user_job_matches")
      .find({ user_id: req.user.user_id })
      .sort({ recommendation_rank: 1 })
      .toArray();
    res.json(matches);
  } catch {
    res.status(500).json({ error: "Failed to fetch matches." });
  }
});

/* ── My Dashboard Matches (preferred-role only) ── */
app.get("/my-dashboard-matches", auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    let matches = await db
      .collection("user_job_matches")
      .find({ user_id: req.user.user_id, is_preferred_role: true })
      .sort({ recommendation_rank: 1 })
      .toArray();

    if (matches.length === 0) {
      await generateMatches(req.user.user_id);
      matches = await db
        .collection("user_job_matches")
        .find({ user_id: req.user.user_id, is_preferred_role: true })
        .sort({ recommendation_rank: 1 })
        .toArray();
    }

    res.json(matches);
  } catch (err) {
    console.error("Dashboard matches error:", err.message);
    res.status(500).json({ error: "Failed to fetch dashboard matches." });
  }
});

/* ── Student Report  ── NEW ── */
app.get("/my-report", auth, async (req, res) => {
  try {
    const db   = mongoose.connection.db;
    const user = await User.findOne({ user_id: req.user.user_id }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    const matches = await db
      .collection("user_job_matches")
      .find({ user_id: req.user.user_id })
      .sort({ recommendation_rank: 1 })
      .toArray();

    const eligible   = matches.filter(m => m.eligible === "Yes").length;
    const avgScore   = matches.length
      ? Math.round(matches.reduce((s, m) => s + (m.overall_match_pct || 0), 0) / matches.length)
      : 0;

    const gapFreq = {};
    matches.forEach(m =>
      (m.missing_mandatory_skills || "").split(",").map(s => s.trim()).filter(Boolean)
        .forEach(sk => { gapFreq[sk] = (gapFreq[sk] || 0) + 1; })
    );
    const topGaps = Object.entries(gapFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    res.json({
      profile: {
        name:              user.name,
        email:             user.email,
        education:         user.education         || "Not specified",
        experience:        user.experience        || "Not specified",
        preferred_role:    user.preferred_role    || "Not specified",
        skills:            user.skills            || "",
        certifications:    user.certifications    || "",
        projects:          user.projects          || "",
        cgpa:    user.cgpa,
        internship_status: user.internship_status || "none",
        resume:            user.resume            || null,
        createdAt:         user.createdAt,
      },
      analytics: {
        total_matches: matches.length,
        eligible_jobs: eligible,
        avg_match_score: avgScore,
        top_skill_gaps: topGaps,
      },
      top_matches: matches.slice(0, 5).map(m => ({
        company_name:      m.company_name,
        job_title:         m.job_title,
        location:          m.location,
        salary:            m.salary,
        overall_match_pct: m.overall_match_pct,
        eligible:          m.eligible,
        matched_skills:    m.matched_skills,
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Report error:", err.message);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

/* ── Generate Matches ── */
app.get("/generate-matches/:userId", auth, async (req, res) => {
  try {
    const matches = await generateMatches(req.params.userId);
    res.json({ message: "Matches generated successfully.", total: matches.length });
  } catch {
    res.status(500).json({ error: "Matching engine failed." });
  }
});

/* ── Resume Upload + PDF Parse + Auto Profile Update ── */
app.post("/upload-resume/:userId", auth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const user = await User.findOne({ user_id: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found." });

    /* Parse PDF text */
    let parsed = { skills: [], education: "", experience: "", name: "" };
    try {
      const buffer  = fs.readFileSync(req.file.path);
      const pdfData = await extractPDFText(buffer);
      const text    = pdfData.text || "";
      console.log("📄 PDF extracted text (first 600 chars):\n", text.slice(0, 600));
      parsed = extractResumeFields(text);
      console.log("🤖 Parsed fields:", JSON.stringify(parsed, null, 2));
    } catch (parseErr) {
      console.warn("PDF parse warning:", parseErr.message);
    }

    /* Build update: merge skills, fill blanks for education/experience */
    const updates = {
      resume: {
        filename:     req.file.filename,
        originalname: req.file.originalname || req.file.filename,
        path:         req.file.path,
        uploadedAt:   new Date(),
      },
    };

    if (parsed.skills.length > 0) {
      const existing = normalizeSkills(user.skills);
      const incoming = parsed.skills.map(s => s.toLowerCase().trim());
      const merged   = [...new Set([...existing, ...incoming])];
      updates.skills = merged.join(", ");
    }
    if (parsed.education && !user.education)   updates.education  = parsed.education;
    if (parsed.experience && !user.experience) updates.experience = parsed.experience;

    const updatedUser = await User.findOneAndUpdate(
      { user_id: req.params.userId },
      { $set: updates },
      { new: true }
    );

    if (updates.skills) generateMatches(req.params.userId).catch(console.error);

    res.json({
      message: "Resume uploaded and profile updated successfully.",
      resume:  updatedUser.resume,
      parsed,
      profileUpdated: {
        skills:    !!updates.skills,
        education: !!updates.education,
        experience:!!updates.experience,
      },
    });
  } catch (err) {
    console.error("Resume upload error:", err.message);
    res.status(500).json({ error: err.message || "Upload failed." });
  }
});

/* ── Resume field extraction helpers ── */
const KNOWN_SKILLS = [
  "javascript","python","java","c++","c#","typescript","go","rust","swift","kotlin","php","ruby","r","scala","dart",
  "react","angular","vue","nextjs","node.js","nodejs","express","django","flask","spring","laravel","fastapi",
  "html","css","sass","tailwind","bootstrap","jquery",
  "sql","mysql","postgresql","mongodb","redis","firebase","sqlite","oracle","cassandra","dynamodb",
  "aws","azure","gcp","docker","kubernetes","terraform","linux","git","ci/cd","jenkins",
  "machine learning","ml","deep learning","tensorflow","pytorch","keras","pandas","numpy","scikit-learn","opencv",
  "power bi","tableau","excel","figma","photoshop","ui/ux","wireframing",
  "rest api","graphql","microservices","agile","scrum","devops","etl","spark","hadoop","kafka",
  "dsa","data structures","algorithms","problem solving","communication",
];

function extractResumeFields(text) {
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return {
    skills:     extractSkills(lower),
    education:  extractSection(lines, ["b.tech","btech","b.e","bachelor","master","m.tech","mtech","mba","phd","12th","university","institute","college","degree"]),
    experience: extractSection(lines, ["experience","intern","worked at","working at","fresher","trainee","engineer at","developer at","analyst at"]),
    name:       extractName(lines),
  };
}

function extractSkills(lowerText) {
  return KNOWN_SKILLS.filter(sk => {
    const esc = sk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![a-z])${esc}(?![a-z])`, "i").test(lowerText);
  });
}

function extractSection(lines, keywords) {
  for (const line of lines) {
    const l = line.toLowerCase();
    if (keywords.some(k => l.includes(k)) && line.length < 120) return line;
  }
  return "";
}

function extractName(lines) {
  for (const line of lines.slice(0, 6)) {
    if (/^[A-Za-z]+([\s][A-Za-z]+){1,3}$/.test(line) && line.length < 50) return line;
  }
  return "";
}

/* ═══════════════════════════════════════════
   ROUTES — ADMIN
═══════════════════════════════════════════ */

app.get("/admin-stats", auth, async (req, res) => {
  try {
    const db            = mongoose.connection.db;
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalJobs     = await db.collection("job_postings").countDocuments();
    const totalMatches  = await db.collection("user_job_matches").countDocuments();
    res.json({ totalStudents, totalJobs, totalMatches });
  } catch {
    res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

app.get("/admin-students", auth, async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password").sort({ createdAt: -1 });
    res.json(students);
  } catch {
    res.status(500).json({ error: "Failed to fetch students." });
  }
});

app.get("/admin-jobs", auth, async (req, res) => {
  try {
    const db   = mongoose.connection.db;
    const jobs = await db.collection("job_postings").find({}).sort({ _id: -1 }).limit(100).toArray();
    res.json(jobs);
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});

app.post("/add-job", auth, async (req, res) => {
  try {
    const { company_name, job_title, location, offered_salary_lpa, openings } = req.body;
    if (!company_name || !job_title)
      return res.status(400).json({ error: "Company name and job title are required." });
    const db = mongoose.connection.db;
    await db.collection("job_postings").insertOne({
      company_name, job_title, location,
      offered_salary_lpa: Number(offered_salary_lpa) || 0,
      openings: Number(openings) || 0,
      createdAt: new Date(),
    });
    res.status(201).json({ message: "Job added successfully." });
  } catch {
    res.status(500).json({ error: "Failed to add job." });
  }
});

app.put("/update-job/:id", auth, async (req, res) => {
  try {
    const { company_name, job_title, location, offered_salary_lpa, openings } = req.body;
    const db = mongoose.connection.db;
    await db.collection("job_postings").updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { company_name, job_title, location, offered_salary_lpa: Number(offered_salary_lpa) || 0, openings: Number(openings) || 0, updatedAt: new Date() } }
    );
    res.json({ message: "Job updated successfully." });
  } catch {
    res.status(500).json({ error: "Failed to update job." });
  }
});

app.delete("/delete-job/:id", auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    await db.collection("job_postings").deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ message: "Job deleted successfully." });
  } catch {
    res.status(500).json({ error: "Failed to delete job." });
  }
});

app.delete("/delete-student/:id", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted successfully." });
  } catch {
    res.status(500).json({ error: "Failed to delete student." });
  }
});

app.get("/create-admin", async (req, res) => {
  try {
    if (await User.findOne({ email: "admin@placeiq.com" }))
      return res.json({ message: "Admin already exists." });
    const hash = await bcrypt.hash("admin123", 12);
    await User.create({ name: "Admin", email: "admin@placeiq.com", password: hash, role: "admin", user_id: "ADMIN001" });
    res.json({ message: "Admin created. Email: admin@placeiq.com | Password: admin123" });
  } catch {
    res.status(500).json({ error: "Failed to create admin." });
  }
});

app.post("/admin/create-admin", auth, async (req, res) => {
  try {
    const requester = await User.findOne({ user_id: req.user.user_id });
    if (!requester || requester.role !== "admin")
      return res.status(403).json({ error: "Only admins can create new admin accounts." });
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required." });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    if (await User.findOne({ email }))
      return res.status(409).json({ error: "An account with this email already exists." });
    const hash  = await bcrypt.hash(password, 12);
    const admin = await User.create({ name, email, password: hash, role: "admin", user_id: "ADM" + Date.now() });
    res.status(201).json({ message: `Admin '${name}' created successfully.`, user_id: admin.user_id });
  } catch (err) {
    console.error("Create admin error:", err.message);
    res.status(500).json({ error: "Failed to create admin." });
  }
});

app.get("/admin/list-admins", auth, async (req, res) => {
  try {
    const requester = await User.findOne({ user_id: req.user.user_id });
    if (!requester || requester.role !== "admin")
      return res.status(403).json({ error: "Access denied." });
    const admins = await User.find({ role: "admin" }).select("-password").sort({ createdAt: -1 });
    res.json(admins);
  } catch {
    res.status(500).json({ error: "Failed to fetch admins." });
  }
});

app.delete("/admin/delete-admin/:id", auth, async (req, res) => {
  try {
    const requester = await User.findOne({ user_id: req.user.user_id });
    if (!requester || requester.role !== "admin")
      return res.status(403).json({ error: "Access denied." });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "Admin not found." });
    if (target.user_id === req.user.user_id)
      return res.status(400).json({ error: "You cannot delete your own admin account." });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted successfully." });
  } catch {
    res.status(500).json({ error: "Failed to delete admin." });
  }
});

/* ═══════════════════════════════════════════
   ERROR HANDLER
═══════════════════════════════════════════ */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error." });
});

/* ═══════════════════════════════════════════
   START
═══════════════════════════════════════════ */
app.listen(PORT, () => console.log(`PlaceIQ server running on port ${PORT} 🚀`));