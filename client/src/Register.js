import React, { useState } from "react";

const ROLE_OPTIONS = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "Data Analyst", "Data Engineer", "Software Engineer",
  "Java Developer", "Python Developer", "UI/UX Designer",
  "DevOps Engineer", "Cloud Engineer", "ML Engineer",
];

const INTERNSHIP_OPTIONS = [
  { value: "none",      label: "No internship" },
  { value: "ongoing",   label: "Currently doing internship" },
  { value: "completed", label: "Completed internship" },
];

/* ── Step labels ── */
const STEPS = [
  "Account Details",
  "Academic Profile",
  "Experience & Extras",
];

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    skills: "", education: "", experience: "", preferred_role: "",
    /* new fields */
    certifications: "", projects: "",
    cgpa: "", internship_status: "none",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [step,    setStep]    = useState(1); // 1 | 2 | 3

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const skillTags = form.skills.split(",").map(s => s.trim()).filter(Boolean);
  const certTags  = form.certifications.split(",").map(s => s.trim()).filter(Boolean);

  /* ── Validate step 1 ── */
  const validate1 = () => {
    if (!form.name)                         return "Full name is required.";
    if (!form.email)                        return "Email is required.";
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters.";
    return "";
  };

  /* ── Validate step 2 ── */
  const validate2 = () => {
    if (!form.skills)         return "Please enter at least one skill.";
    if (!form.preferred_role) return "Please select a preferred role.";
    return "";
  };

  const goNext = (currentStep) => {
    const err = currentStep === 1 ? validate1() : validate2();
    if (err) { setError(err); return; }
    setError("");
    setStep(currentStep + 1);
  };

  /* ── Final submit ── */
  const register = async () => {
    setError(""); setLoading(true);
    const cgpaVal = form.cgpa !== "" ? Number(form.cgpa) : null;
    if (form.cgpa !== "" && (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10)) {
      setError("CGPA must be a number between 0 and 10.");
      setLoading(false); return;
    }
    try {
      const res  = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cgpa: cgpaVal }),
      });
      const data = await res.json();
      if (data.message) {
        window.location.href = "/login";
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
      <div style={{
        background: "#fff", borderRadius: "20px",
        padding: "36px", width: "100%", maxWidth: "520px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "48px", height: "48px", margin: "0 auto 12px",
            background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
            borderRadius: "14px", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "20px", fontWeight: "800", color: "#0f172a",
          }}>P</div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>
            Create Student Account
          </h2>
          <p style={{ margin: "5px 0 0", fontSize: "13px", color: "#94a3b8" }}>
            Join your college placement portal
          </p>
        </div>

        {/* Step progress bar */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: "4px", borderRadius: "4px",
              background: i + 1 <= step ? "#3B82F6" : "#e2e8f0",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
        <p style={{ margin: "0 0 18px", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.06em" }}>
          Step {step} of {STEPS.length} — {STEPS[step - 1]}
        </p>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: "10px", padding: "10px 14px",
            marginBottom: "14px", fontSize: "13px", color: "#DC2626",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ═══════════ STEP 1 — Account ═══════════ */}
        {step === 1 && (
          <>
            <Field label="Full Name">
              <input style={inputStyle} placeholder="e.g. Arjun Sharma" value={form.name}
                onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Email Address">
              <input style={inputStyle} type="email" placeholder="you@college.edu" value={form.email}
                onChange={e => set("email", e.target.value)} />
            </Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  type={showPwd ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                />
                <button onClick={() => setShowPwd(!showPwd)} style={eyeBtn}>
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
              {form.password.length > 0 && (
                <div style={{ marginTop: "6px", display: "flex", gap: "4px" }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: "3px", borderRadius: "3px",
                      background: form.password.length >= i * 3 ? strengthColor(form.password.length) : "#e2e8f0",
                    }} />
                  ))}
                </div>
              )}
            </Field>
            <button onClick={() => goNext(1)} style={primaryBtn}>Continue →</button>
          </>
        )}

        {/* ═══════════ STEP 2 — Academic Profile ═══════════ */}
        {step === 2 && (
          <>
            <Field label="Skills (comma-separated)">
              <input style={inputStyle} placeholder="Python, SQL, React, Excel…"
                value={form.skills} onChange={e => set("skills", e.target.value)} />
              {skillTags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
                  {skillTags.map((sk, i) => (
                    <span key={i} style={tagStyle("#EFF6FF", "#1D4ED8")}>{sk}</span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Education">
              <input style={inputStyle} placeholder="B.Tech CSE, 2025"
                value={form.education} onChange={e => set("education", e.target.value)} />
            </Field>
            <Field label="Experience">
              <input style={inputStyle} placeholder="Fresher / 1 year internship…"
                value={form.experience} onChange={e => set("experience", e.target.value)} />
            </Field>
            <Field label="Preferred Role">
              <select value={form.preferred_role}
                onChange={e => set("preferred_role", e.target.value)}
                style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                <option value="">— Select a role —</option>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setStep(1); setError(""); }}
                style={{ ...primaryBtn, background: "#f1f5f9", color: "#475569", width: "auto", padding: "13px 18px" }}>
                ← Back
              </button>
              <button onClick={() => goNext(2)} style={{ ...primaryBtn, flex: 1 }}>Continue →</button>
            </div>
          </>
        )}

        {/* ═══════════ STEP 3 — Experience & Extras ═══════════ */}
        {step === 3 && (
          <>
            {/* Certifications */}
            <Field label="Certifications (comma-separated)" hint="Optional">
              <input style={inputStyle}
                placeholder="AWS Cloud Practitioner, Google Data Analytics…"
                value={form.certifications}
                onChange={e => set("certifications", e.target.value)} />
              {certTags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
                  {certTags.map((c, i) => (
                    <span key={i} style={tagStyle("#F0FDF4", "#15803d")}>🏅 {c}</span>
                  ))}
                </div>
              )}
            </Field>

            {/* Projects */}
            <Field label="Projects" hint="Optional">
              <textarea
                style={{ ...inputStyle, minHeight: "90px", resize: "vertical", lineHeight: "1.6" }}
                placeholder="e.g. E-commerce website using React & Node.js; ML model for sentiment analysis…"
                value={form.projects}
                onChange={e => set("projects", e.target.value)}
              />
            </Field>

            {/* Two-column row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* CGPA */}
              <Field label="CGPA" hint="0 – 10, Optional">
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    type="number" min="0" max="10" step="0.1"
                    placeholder="e.g. 8.5"
                    value={form.cgpa}
                    onChange={e => set("cgpa", e.target.value)}
                  />
                  {form.cgpa !== "" && (
                    <span style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "11px", fontWeight: "800",
                      color: Number(form.cgpa) >= 8 ? "#15803d" : Number(form.cgpa) >= 6 ? "#92400e" : "#b91c1c",
                    }}>
                      {Number(form.cgpa) >= 8 ? "Great" : Number(form.cgpa) >= 6 ? "Good" : "Low"}
                    </span>
                  )}
                </div>
                {/* CGPA bar */}
                {form.cgpa !== "" && !isNaN(Number(form.cgpa)) && (
                  <div style={{ marginTop: "6px", background: "#f1f5f9", height: "4px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, Number(form.cgpa) * 10))}%`,
                      height: "100%", borderRadius: "4px",
                      background: Number(form.cgpa) >= 8 ? "#22c55e" : Number(form.cgpa) >= 6 ? "#F59E0B" : "#EF4444",
                      transition: "width 0.3s",
                    }} />
                  </div>
                )}
              </Field>

              {/* Internship Status */}
              <Field label="Internship Status">
                <select
                  value={form.internship_status}
                  onChange={e => set("internship_status", e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                >
                  {INTERNSHIP_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span style={{ display: "block", marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                  {form.internship_status === "completed" ? "✅ Great! Internship experience boosts your profile." :
                   form.internship_status === "ongoing"   ? "🔄 Keep going — add it once complete." :
                   "💡 Internships can improve match scores."}
                </span>
              </Field>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button onClick={() => { setStep(2); setError(""); }}
                style={{ ...primaryBtn, background: "#f1f5f9", color: "#475569", width: "auto", padding: "13px 18px" }}>
                ← Back
              </button>
              <button onClick={register} disabled={loading} style={{ ...primaryBtn, flex: 1 }}>
                {loading ? "Creating account…" : "Create Account ✓"}
              </button>
            </div>
          </>
        )}

        <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "#64748b" }}>
          Already registered?{" "}
          <a href="/login" style={{ color: "#3B82F6", fontWeight: "600", textDecoration: "none" }}>
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}

/* ── Small helpers ── */
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{
        display: "flex", justifyContent: "space-between",
        fontSize: "12px", fontWeight: "700", color: "#475569",
        marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        <span>{label}</span>
        {hint && <span style={{ fontWeight: "500", color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function strengthColor(len) {
  if (len < 6)  return "#EF4444";
  if (len < 10) return "#F59E0B";
  return "#22C55E";
}

const tagStyle = (bg, color) => ({
  padding: "3px 10px", borderRadius: "20px",
  background: bg, color,
  fontSize: "12px", fontWeight: "600",
});

const inputStyle = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #e2e8f0", borderRadius: "10px",
  fontSize: "14px", color: "#0f172a", outline: "none",
  boxSizing: "border-box", background: "#f8fafc",
};

const primaryBtn = {
  width: "100%", padding: "13px",
  background: "linear-gradient(135deg, #3B82F6, #2563eb)",
  color: "#fff", border: "none", borderRadius: "12px",
  fontSize: "15px", fontWeight: "700", cursor: "pointer",
  marginTop: "6px",
};

const eyeBtn = {
  position: "absolute", right: "12px", top: "50%",
  transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer",
  fontSize: "16px", color: "#94a3b8", padding: 0,
};