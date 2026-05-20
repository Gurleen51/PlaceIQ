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

const app = express();

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const JWT_SECRET   = process.env.JWT_SECRET || "SECRET123";
const MONGO_URI    = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

/* ═══════════════════════════════════════════
   CORS — must be FIRST middleware
   Handles preflight OPTIONS requests properly
═══════════════════════════════════════════ */
app.use(cors({
  origin: function (origin, callback) {
    /* Allow requests with no origin (mobile apps, curl, Postman) */
    if (!origin) return callback(null, true);
    return callback(null, true); // allow all — tighten in production
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

/* Handle OPTIONS preflight for ALL routes */
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ═══════════════════════════════════════════
   MULTER — memory storage (serverless safe)
═══════════════════════════════════════════ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

/* ═══════════════════════════════════════════
   DATABASE — cached connection for serverless
═══════════════════════════════════════════ */
let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  const connection = await mongoose.connect(MONGO_URI, {
    bufferCommands:    false,
    maxPoolSize:       10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:   45000,
  });
  cachedDb = connection;
  console.log("MongoDB connected ✅");
  return connection;
}

/* ═══════════════════════════════════════════
   USER MODEL
   Use mongoose.models to avoid re-declaration
   across hot reloads in serverless
═══════════════════════════════════════════ */
const UserSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:       { type: String, required: true },
    role:           { type: String, enum: ["student", "admin"], default: "student" },
    user_id:        { type: String, unique: true, sparse: true },
    skills:         { type: String, default: "" },
    education:      { type: String, default: "" },
    experience:     { type: String, default: "" },
    preferred_role: { type: String, default: "" },
    certifications: { type: String, default: "" },
    projects:       { type: String, default: "" },
    cgpa:           { type: Number, default: null },
    resume: {
      filename:   String,
      uploadedAt: Date,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

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
   DB CONNECT — runs before every request
═══════════════════════════════════════════ */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ error: "Database connection failed. Check MONGO_URI env variable." });
  }
});

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
function normalizeSkills(text) {
  return (text || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
}

function getRequiredSkills(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("full stack"))        return ["html","css","javascript","react","nodejs"];
  if (t.includes("frontend"))          return ["html","css","javascript","react"];
  if (t.includes("backend"))           return ["nodejs","express","mongodb","sql"];
  if (t.includes("web developer"))     return ["html","css","javascript","react"];
  if (t.includes("data engineer"))     return ["python","sql","etl","spark"];
  if (t.includes("data analyst"))      return ["excel","sql","python","power bi"];
  if (t.includes("software engineer")) return ["java","javascript","dsa"];
  if (t.includes("java"))              return ["java","spring","sql"];
  if (t.includes("python"))            return ["python","django","flask"];
  if (t.includes("designer"))          return ["figma","ui","ux","wireframe"];
  if (t.includes("devops"))            return ["docker","kubernetes","ci/cd","linux"];
  if (t.includes("cloud"))             return ["aws","azure","gcp","terraform"];
  if (t.includes("ml") || t.includes("machine learning"))
    return ["python","ml","tensorflow","pandas"];
  return ["communication"];
}

/* ═══════════════════════════════════════════
   MATCHING ENGINE
═══════════════════════════════════════════ */
async function generateMatches(userId) {
  try {
    const db   = mongoose.connection.db;
    const user = await User.findOne({ user_id: userId });
    if (!user) return [];

    let rawJobs = await db.collection("job_postings").find({}).limit(200).toArray();
    const seen  = new Set();
    const jobs  = rawJobs.filter(job => {
      const key = `${(job.job_title||"").toLowerCase()}_${(job.company_name||"").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    const userSkills = normalizeSkills(user.skills);
    const pref       = (user.preferred_role || "").toLowerCase();

    const matches = jobs.map(job => {
      const required    = getRequiredSkills(job.job_title);
      const matched     = required.filter(s => userSkills.includes(s));
      const missing     = required.filter(s => !userSkills.includes(s));
      const title       = (job.job_title || "").toLowerCase();
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
  } catch (err) {
    console.error("generateMatches error:", err.message);
    return [];
  }
}

/* ═══════════════════════════════════════════
   ROUTES — PUBLIC
═══════════════════════════════════════════ */

app.get("/", (req, res) => {
  res.json({ message: "PlaceIQ API Running 🚀", status: "ok" });
});

/* ── Register ── */
app.post("/auth/register", async (req, res) => {
  try {
    const {
      name, email, password,
      skills, education, experience, preferred_role,
      certifications, projects, cgpa,
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
      skills:         skills         || "",
      education:      education      || "",
      experience:     experience     || "",
      preferred_role: preferred_role || "",
      certifications: certifications || "",
      projects:       projects       || "",
      cgpa:           cgpa != null   ? Number(cgpa) : null,
    });

    generateMatches(user.user_id).catch(console.error);

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
        console.error("Background match error:", err.message)
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
    const db   = mongoose.connection.db;
    const raw  = await db.collection("job_postings").find({}).limit(200).toArray();
    const seen = new Set();
    const jobs = raw.filter(j => {
      const key = `${(j.job_title||"").toLowerCase()}_${(j.company_name||"").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    res.json(jobs);
  } catch (err) {
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

/* ── Dashboard stats ── */
app.get("/dashboard-stats", async (req, res) => {
  try {
    const db           = mongoose.connection.db;
    const users        = await User.countDocuments({ role: "student" });
    const jobs         = await db.collection("job_postings").countDocuments();
    const applications = await db.collection("user_job_matches").countDocuments();
    const usersData    = await User.find({ role: "student" }).select("skills");
    const skillSet     = new Set();
    usersData.forEach(u => normalizeSkills(u.skills).forEach(s => skillSet.add(s)));
    res.json({ users, jobs, applications, skills: skillSet.size });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

/* ── Skills data ── */
app.get("/skills-data", async (req, res) => {
  try {
    const users    = await User.find({ role: "student" }).select("skills");
    const skillMap = {};
    users.forEach(u =>
      normalizeSkills(u.skills).forEach(sk => {
        skillMap[sk] = (skillMap[sk] || 0) + 1;
      })
    );
    res.json(
      Object.entries(skillMap)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
    );
  } catch {
    res.status(500).json({ error: "Failed to fetch skills." });
  }
});

/* ── Salary data ── */
app.get("/salary-data", async (req, res) => {
  try {
    const db     = mongoose.connection.db;
    const jobs   = await db.collection("job_postings").find({}).toArray();
    const ranges = { "0-3 LPA": 0, "3-6 LPA": 0, "6-10 LPA": 0, "10+ LPA": 0 };
    jobs.forEach(j => {
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

/* ── Create Admin (one-time setup) ── */
app.get("/create-admin", async (req, res) => {
  try {
    if (await User.findOne({ email: "admin@placeiq.com" }))
      return res.json({ message: "Admin already exists." });
    const hash = await bcrypt.hash("admin123", 12);
    await User.create({
      name: "Admin", email: "admin@placeiq.com",
      password: hash, role: "admin", user_id: "ADMIN001",
    });
    res.json({ message: "Admin created. Email: admin@placeiq.com | Password: admin123" });
  } catch {
    res.status(500).json({ error: "Failed to create admin." });
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

/* ── Update Profile ── */
app.put("/update-profile", auth, async (req, res) => {
  try {
    const {
      name, skills, education, experience, preferred_role,
      certifications, projects, cgpa,
    } = req.body;

    const updated = await User.findOneAndUpdate(
      { user_id: req.user.user_id },
      {
        $set: {
          name,
          skills:         skills         || "",
          education:      education      || "",
          experience:     experience     || "",
          preferred_role: preferred_role || "",
          certifications: certifications || "",
          projects:       projects       || "",
          cgpa:           cgpa != null && cgpa !== "" ? Number(cgpa) : null,
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "User not found." });
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

/* ── My Dashboard Matches (preferred role only) ── */
app.get("/my-dashboard-matches", auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    let matches = await db
      .collection("user_job_matches")
      .find({ user_id: req.user.user_id, is_preferred_role: true })
      .sort({ recommendation_rank: 1 })
      .toArray();

    if (matches.length === 0) {
      console.log("No preferred matches — regenerating for:", req.user.user_id);
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

/* ── Generate Matches ── */
app.get("/generate-matches/:userId", auth, async (req, res) => {
  try {
    const matches = await generateMatches(req.params.userId);
    res.json({ message: "Matches generated.", total: matches.length });
  } catch {
    res.status(500).json({ error: "Matching failed." });
  }
});

/* ── Upload Resume ── */
app.post("/upload-resume/:userId", auth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const user = await User.findOneAndUpdate(
      { user_id: req.params.userId },
      { resume: { filename: req.file.originalname, uploadedAt: new Date() } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ message: "Resume uploaded successfully.", resume: user.resume });
  } catch (err) {
    res.status(500).json({ error: err.message || "Upload failed." });
  }
});

/* ── My Report ── */
app.get("/my-report", auth, async (req, res) => {
  try {
    const db   = mongoose.connection.db;
    const user = await User.findOne({ user_id: req.user.user_id }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    const matches  = await db.collection("user_job_matches")
      .find({ user_id: req.user.user_id })
      .sort({ recommendation_rank: 1 })
      .toArray();

    const eligible = matches.filter(m => m.eligible === "Yes").length;
    const avgScore = matches.length
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
        name:           user.name,
        email:          user.email,
        education:      user.education      || "Not specified",
        experience:     user.experience     || "Not specified",
        preferred_role: user.preferred_role || "Not specified",
        skills:         user.skills         || "",
        certifications: user.certifications || "",
        projects:       user.projects       || "",
        cgpa:           user.cgpa,
        createdAt:      user.createdAt,
      },
      analytics: {
        total_matches:   matches.length,
        eligible_jobs:   eligible,
        avg_match_score: avgScore,
        top_skill_gaps:  topGaps,
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
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

app.get("/admin-students", auth, async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(students);
  } catch {
    res.status(500).json({ error: "Failed to fetch students." });
  }
});

app.get("/admin-jobs", auth, async (req, res) => {
  try {
    const db   = mongoose.connection.db;
    const jobs = await db.collection("job_postings")
      .find({}).sort({ _id: -1 }).limit(100).toArray();
    res.json(jobs);
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});

app.post("/add-job", auth, async (req, res) => {
  try {
    const { company_name, job_title, location, offered_salary_lpa, openings } = req.body;
    if (!company_name || !job_title)
      return res.status(400).json({ error: "Company and title required." });
    const db = mongoose.connection.db;
    await db.collection("job_postings").insertOne({
      company_name, job_title, location,
      offered_salary_lpa: Number(offered_salary_lpa) || 0,
      openings:           Number(openings)           || 0,
      createdAt:          new Date(),
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
      {
        $set: {
          company_name, job_title, location,
          offered_salary_lpa: Number(offered_salary_lpa) || 0,
          openings:           Number(openings)           || 0,
          updatedAt:          new Date(),
        },
      }
    );
    res.json({ message: "Job updated successfully." });
  } catch {
    res.status(500).json({ error: "Failed to update job." });
  }
});

app.delete("/delete-job/:id", auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    await db.collection("job_postings").deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });
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

app.post("/admin/create-admin", auth, async (req, res) => {
  try {
    const requester = await User.findOne({ user_id: req.user.user_id });
    if (!requester || requester.role !== "admin")
      return res.status(403).json({ error: "Access denied." });

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required." });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    if (await User.findOne({ email }))
      return res.status(409).json({ error: "Email already exists." });

    const hash  = await bcrypt.hash(password, 12);
    const admin = await User.create({
      name, email, password: hash,
      role: "admin", user_id: "ADM" + Date.now(),
    });
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
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });
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
      return res.status(400).json({ error: "You cannot delete your own account." });
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
   EXPORT — no app.listen() for Vercel
═══════════════════════════════════════════ */
module.exports = app;
