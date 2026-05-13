import React, { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function getRequiredSkills(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("full stack"))         return ["React", "Node.js", "JavaScript", "HTML", "CSS"];
  if (t.includes("frontend"))           return ["React", "HTML", "CSS", "JavaScript"];
  if (t.includes("backend"))            return ["Node.js", "Express", "MongoDB", "SQL"];
  if (t.includes("web developer"))      return ["HTML", "CSS", "JavaScript", "React"];
  if (t.includes("data engineer"))      return ["Python", "SQL", "ETL", "Spark"];
  if (t.includes("data analyst"))       return ["SQL", "Python", "Excel", "Power BI"];
  if (t.includes("software engineer"))  return ["Java", "JavaScript", "DSA"];
  if (t.includes("java"))               return ["Java", "Spring Boot", "SQL"];
  if (t.includes("python"))             return ["Python", "Django", "Flask"];
  if (t.includes("designer"))           return ["Figma", "UI/UX", "Wireframing", "CSS"];
  if (t.includes("devops"))             return ["Docker", "Kubernetes", "CI/CD", "Linux"];
  if (t.includes("cloud"))              return ["AWS", "Azure", "Terraform", "Linux"];
  if (t.includes("ml") || t.includes("machine learning"))
    return ["Python", "TensorFlow", "Pandas", "ML"];
  return ["Communication", "Problem Solving", "Git", "Agile"];
}

function getResponsibilities(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("full stack"))
    return ["Build end-to-end web features using React and Node.js", "Design and integrate RESTful APIs", "Collaborate with design and backend teams", "Write clean, maintainable code with proper documentation"];
  if (t.includes("frontend"))
    return ["Develop responsive UI components in React", "Translate Figma designs into pixel-perfect code", "Optimise web performance and accessibility", "Work closely with UX designers"];
  if (t.includes("backend"))
    return ["Design and build scalable REST APIs", "Manage and optimise database schemas", "Implement authentication and security best practices", "Write unit and integration tests"];
  if (t.includes("data analyst"))
    return ["Analyse large datasets to identify trends", "Create dashboards in Power BI / Tableau", "Write SQL queries for data extraction", "Present insights to stakeholders"];
  if (t.includes("data engineer"))
    return ["Build and maintain data pipelines", "Work with Spark and cloud data warehouses", "Ensure data quality and integrity", "Collaborate with analysts and scientists"];
  if (t.includes("java"))
    return ["Develop Java-based microservices", "Work with Spring Boot and REST APIs", "Write and maintain unit tests", "Participate in code reviews"];
  if (t.includes("python"))
    return ["Develop Python scripts and web applications", "Build APIs using Django or Flask", "Work with data processing libraries", "Maintain and optimise existing codebases"];
  if (t.includes("devops"))
    return ["Manage CI/CD pipelines", "Maintain Kubernetes clusters and Docker containers", "Monitor infrastructure and respond to incidents", "Automate deployment and scaling workflows"];
  return ["Contribute to product development", "Collaborate with cross-functional teams", "Write clean, well-tested code", "Participate in agile ceremonies and code reviews"];
}

function salaryColor(sal) {
  const s = Number(sal);
  if (s >= 10) return { bg: "#dcfce7", text: "#15803d" };
  if (s >= 6)  return { bg: "#dbeafe", text: "#1d4ed8" };
  if (s >= 3)  return { bg: "#fef9c3", text: "#92400e" };
  return        { bg: "#f1f5f9",  text: "#475569" };
}

function avatarColor(name) {
  const colors = [
    "linear-gradient(135deg,#3B82F6,#6EE7B7)",
    "linear-gradient(135deg,#F59E0B,#EF4444)",
    "linear-gradient(135deg,#8B5CF6,#EC4899)",
    "linear-gradient(135deg,#14B8A6,#3B82F6)",
    "linear-gradient(135deg,#F97316,#F59E0B)",
  ];
  return colors[(name || "").charCodeAt(0) % colors.length];
}

/* ═══════════════════════════════════════
   SKILL MATCH PANEL (inside modal)
═══════════════════════════════════════ */
function SkillMatchPanel({ job, onClose }) {
  const rawSkills    = localStorage.getItem("skills") || "";
  const studentSkills = rawSkills.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  const required     = getRequiredSkills(job.job_title);
  const matched      = required.filter(sk => studentSkills.includes(sk.toLowerCase()));
  const missing      = required.filter(sk => !studentSkills.includes(sk.toLowerCase()));
  const pct          = Math.round((matched.length / required.length) * 100);

  const scoreColor =
    pct >= 80 ? { bar: "#22c55e", text: "#15803d", bg: "#dcfce7", label: "Excellent Match" } :
    pct >= 60 ? { bar: "#3B82F6", text: "#1d4ed8", bg: "#dbeafe", label: "Good Match — Eligible" } :
    pct >= 40 ? { bar: "#F59E0B", text: "#92400e", bg: "#fef3c7", label: "Partial Match" } :
                { bar: "#EF4444", text: "#b91c1c", bg: "#fee2e2", label: "Low Match" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Score circle + bar */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
        borderRadius: "14px", padding: "20px 22px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#6EE7B7", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Your Match Score
            </p>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              {job.job_title} at {job.company_name}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "40px", fontWeight: "900", color: scoreColor.bar, letterSpacing: "-0.05em", lineHeight: 1 }}>
              {pct}%
            </p>
            <span style={{
              fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
              background: scoreColor.bg, color: scoreColor.text, fontWeight: "700",
            }}>
              {scoreColor.label}
            </span>
          </div>
        </div>
        {/* Bar */}
        <div style={{ background: "rgba(255,255,255,0.15)", height: "10px", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: "10px",
            background: scoreColor.bar, transition: "width 0.6s ease",
          }} />
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
          {matched.length} of {required.length} required skills matched
        </p>
      </div>

      {/* Two columns — have / missing */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

        {/* Skills you have */}
        <div style={{
          background: "#f0fdf4", borderRadius: "12px",
          padding: "14px 16px", border: "1px solid #86efac",
        }}>
          <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "800", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ✅ You Have ({matched.length})
          </p>
          {matched.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {matched.map((sk, i) => (
                <span key={i} style={{
                  padding: "4px 11px", borderRadius: "20px", fontSize: "12px",
                  fontWeight: "600", background: "#dcfce7", color: "#15803d",
                  border: "1px solid #86efac",
                }}>✓ {sk}</span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
              None matched yet
            </p>
          )}
        </div>

        {/* Skills you need */}
        <div style={{
          background: "#fef2f2", borderRadius: "12px",
          padding: "14px 16px", border: "1px solid #fca5a5",
        }}>
          <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "800", color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ❌ Need to Learn ({missing.length})
          </p>
          {missing.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {missing.map((sk, i) => (
                <span key={i} style={{
                  padding: "4px 11px", borderRadius: "20px", fontSize: "12px",
                  fontWeight: "600", background: "#fee2e2", color: "#b91c1c",
                  border: "1px solid #fca5a5",
                }}>✗ {sk}</span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "13px", color: "#15803d", fontWeight: "700" }}>
              🎉 You have all skills!
            </p>
          )}
        </div>
      </div>

      {/* Eligibility verdict */}
      <div style={{
        padding: "14px 18px", borderRadius: "12px",
        background: pct >= 60 ? "#f0fdf4" : "#fffbeb",
        border: `1px solid ${pct >= 60 ? "#86efac" : "#fde68a"}`,
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <span style={{ fontSize: "24px" }}>{pct >= 60 ? "🎯" : "📚"}</span>
        <div>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: pct >= 60 ? "#15803d" : "#92400e" }}>
            {pct >= 60 ? "You are eligible for this role!" : "Keep learning to become eligible"}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
            {pct >= 60
              ? "Your skill profile meets the minimum requirements. Apply via your college placement cell."
              : `Learn ${missing.slice(0, 2).join(", ")}${missing.length > 2 ? ` and ${missing.length - 2} more` : ""} to improve your match score.`}
          </p>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={onClose}
        style={{
          padding: "11px", background: "#f1f5f9", color: "#475569",
          border: "none", borderRadius: "10px", fontSize: "14px",
          fontWeight: "600", cursor: "pointer", textAlign: "center",
        }}
      >
        ← Back to Job Details
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Jobs() {
  const role = localStorage.getItem("role");

  const [jobs,        setJobs]        = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showMatch,   setShowMatch]   = useState(false); // toggle inside modal

  /* Fetch jobs */
  useEffect(() => {
    fetch(`${API}/jobs`)
      .then(r => r.json())
      .then(data => { setJobs(data); setFiltered(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* Escape key closes modal */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Prevent body scroll when modal open */
  useEffect(() => {
    document.body.style.overflow = selectedJob ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedJob]);

  const openModal  = (job) => { setSelectedJob(job); setShowMatch(false); };
  const closeModal = ()    => { setSelectedJob(null); setShowMatch(false); };

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setSearch(e.target.value);
    setFiltered(jobs.filter(j =>
      (j.job_title    || "").toLowerCase().includes(q) ||
      (j.company_name || "").toLowerCase().includes(q) ||
      (j.location     || "").toLowerCase().includes(q)
    ));
  };

  /* Quick match preview on cards (for logged-in students) */
  const isStudent     = role === "student";
  const studentSkills = (localStorage.getItem("skills") || "")
    .toLowerCase().split(",").map(s => s.trim()).filter(Boolean);

  const cardMatchPct = (job) => {
    if (!isStudent) return null;
    const req     = getRequiredSkills(job.job_title);
    const matched = req.filter(sk => studentSkills.includes(sk.toLowerCase()));
    return Math.round((matched.length / req.length) * 100);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>
          Job Listings
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
          {filtered.length} opportunities available — click any card for details
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "20px", position: "relative" }}>
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "16px" }}>🔍</span>
        <input
          value={search} onChange={handleSearch}
          placeholder="Search by company, role, or location…"
          style={{
            width: "100%", padding: "11px 14px 11px 42px",
            borderRadius: "12px", border: "1.5px solid #e2e8f0",
            fontSize: "14px", color: "#0f172a", background: "#fff",
            boxSizing: "border-box", outline: "none",
          }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading jobs…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>No jobs match your search.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map((job, i) => {
            const sc  = salaryColor(job.offered_salary_lpa);
            const pct = cardMatchPct(job);
            const scoreCol = pct >= 60 ? "#22c55e" : pct >= 40 ? "#F59E0B" : "#EF4444";
            return (
              <div
                key={job._id || i}
                onClick={() => openModal(job)}
                style={{
                  background: "#fff", borderRadius: "16px", padding: "20px",
                  border: "1px solid #e2e8f0", display: "flex",
                  flexDirection: "column", gap: "10px",
                  cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "#3B82F6";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                {/* Title + salary */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                      {job.job_title || "Untitled Role"}
                    </h3>
                    <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
                      {job.company_name || "Unknown Company"}
                    </p>
                  </div>
                  {job.offered_salary_lpa && (
                    <span style={{
                      fontSize: "12px", fontWeight: "700", padding: "4px 10px",
                      borderRadius: "20px", background: sc.bg, color: sc.text, whiteSpace: "nowrap",
                    }}>{job.offered_salary_lpa} LPA</span>
                  )}
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: 0 }} />

                {/* Meta */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {job.location && <span style={{ fontSize: "12px", color: "#64748b" }}>📍 {job.location}</span>}
                  {job.openings && <span style={{ fontSize: "12px", color: "#64748b" }}>👥 {job.openings} openings</span>}
                </div>

                {/* Match score mini-bar on card (students only) */}
                {isStudent && pct !== null && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Your Match</span>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: scoreCol }}>{pct}%</span>
                    </div>
                    <div style={{ background: "#f1f5f9", height: "5px", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: "5px", background: scoreCol }} />
                    </div>
                  </div>
                )}

                <div style={{
                  marginTop: "4px", padding: "9px", border: "none",
                  borderRadius: "10px", background: "#EFF6FF",
                  color: "#1D4ED8", fontWeight: "700", fontSize: "13px",
                  textAlign: "center",
                }}>
                  View Details →
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════
          MODAL
      ════════════════════════════════ */}
      {selectedJob && (
        <>
          {/* Backdrop */}
          <div onClick={closeModal} style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(4px)", zIndex: 1000,
          }} />

          {/* Panel */}
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(580px, 94vw)", maxHeight: "88vh",
            overflowY: "auto", background: "#fff",
            borderRadius: "20px", zIndex: 1001,
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}>

            {/* ── Modal Header ── */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
              borderRadius: "20px 20px 0 0", padding: "26px 28px 22px",
              position: "relative",
            }}>
              <button
                onClick={closeModal}
                style={{
                  position: "absolute", top: "16px", right: "16px",
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)", border: "none",
                  color: "#fff", fontSize: "16px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "700",
                }}
              >✕</button>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "13px",
                  background: avatarColor(selectedJob.company_name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: "800", color: "#fff", flexShrink: 0,
                }}>
                  {(selectedJob.company_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#fff", letterSpacing: "-0.02em" }}>
                    {selectedJob.job_title}
                  </h2>
                  <p style={{ margin: "3px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>
                    {selectedJob.company_name}
                  </p>
                </div>
              </div>

              {selectedJob.offered_salary_lpa && (
                <div style={{ marginTop: "14px" }}>
                  <span style={{
                    fontSize: "13px", fontWeight: "700", padding: "5px 14px",
                    borderRadius: "20px", background: "rgba(110,231,183,0.2)",
                    color: "#6EE7B7", border: "1px solid rgba(110,231,183,0.3)",
                  }}>💰 {selectedJob.offered_salary_lpa} LPA</span>
                </div>
              )}

              {/* Tab switcher inside header */}
              {isStudent && (
                <div style={{ display: "flex", gap: "6px", marginTop: "16px" }}>
                  <button
                    onClick={() => setShowMatch(false)}
                    style={{
                      padding: "6px 16px", borderRadius: "20px", fontSize: "12px",
                      fontWeight: "700", cursor: "pointer", border: "none",
                      background: !showMatch ? "#fff" : "rgba(255,255,255,0.12)",
                      color:      !showMatch ? "#0f172a" : "rgba(255,255,255,0.7)",
                      transition: "all 0.15s",
                    }}
                  >📋 Job Details</button>
                  <button
                    onClick={() => setShowMatch(true)}
                    style={{
                      padding: "6px 16px", borderRadius: "20px", fontSize: "12px",
                      fontWeight: "700", cursor: "pointer", border: "none",
                      background: showMatch ? "#6EE7B7" : "rgba(255,255,255,0.12)",
                      color:      showMatch ? "#0f172a" : "rgba(255,255,255,0.7)",
                      transition: "all 0.15s",
                    }}
                  >🎯 Check My Match</button>
                </div>
              )}
            </div>

            {/* ── Modal Body ── */}
            <div style={{ padding: "24px 28px 28px" }}>

              {/* ── VIEW: SKILL MATCH ── */}
              {showMatch ? (
                <SkillMatchPanel
                  job={selectedJob}
                  onClose={() => setShowMatch(false)}
                />
              ) : (
                /* ── VIEW: JOB DETAILS ── */
                <>
                  {/* Key info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "22px" }}>
                    {[
                      { icon: "📍", label: "Location",   value: selectedJob.location || "Not specified" },
                      { icon: "👥", label: "Openings",   value: selectedJob.openings ? `${selectedJob.openings} positions` : "Not specified" },
                      { icon: "💼", label: "Job Type",   value: "Full Time" },
                      { icon: "🎓", label: "Experience", value: "Freshers / 0-2 years" },
                    ].map((item, i) => (
                      <div key={i} style={{
                        background: "#f8fafc", borderRadius: "12px",
                        padding: "14px 16px", border: "1px solid #e2e8f0",
                      }}>
                        <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {item.icon} {item.label}
                        </p>
                        <p style={{ margin: "5px 0 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* About */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={sectionHead}>📋 About the Role</h4>
                    <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.75" }}>
                      {selectedJob.company_name} is hiring a <strong>{selectedJob.job_title}</strong> to join their growing team
                      {selectedJob.location ? ` in ${selectedJob.location}` : ""}. This is an excellent opportunity for students looking to kick-start their careers in a dynamic environment.
                    </p>
                  </div>

                  {/* Responsibilities */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={sectionHead}>🛠 Responsibilities</h4>
                    <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {getResponsibilities(selectedJob.job_title).map((r, i) => (
                        <li key={i} style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Requirements */}
                  <div style={{ marginBottom: "22px" }}>
                    <h4 style={sectionHead}>✅ Required Skills</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {getRequiredSkills(selectedJob.job_title).map((tag, i) => (
                        <span key={i} style={{
                          padding: "5px 13px", borderRadius: "20px",
                          background: "#EFF6FF", color: "#1D4ED8",
                          fontSize: "13px", fontWeight: "600", border: "1px solid #BFDBFE",
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Salary highlight */}
                  {selectedJob.offered_salary_lpa && (
                    <div style={{
                      background: "linear-gradient(135deg, #0f172a, #1e293b)",
                      borderRadius: "12px", padding: "16px 20px",
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px",
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Offered Package
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: "900", color: "#6EE7B7", letterSpacing: "-0.04em" }}>
                          ₹{selectedJob.offered_salary_lpa} LPA
                        </p>
                      </div>
                      {selectedJob.openings && (
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Open Seats
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: "26px", fontWeight: "900", color: "#93C5FD", letterSpacing: "-0.04em" }}>
                            {selectedJob.openings}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA buttons */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    {isStudent && (
                      <button
                        onClick={() => setShowMatch(true)}
                        style={{
                          flex: 1, padding: "13px",
                          background: "linear-gradient(135deg, #3B82F6, #2563eb)",
                          color: "#fff", border: "none", borderRadius: "12px",
                          fontSize: "14px", fontWeight: "700", cursor: "pointer",
                        }}
                      >
                        🎯 Check My Match
                      </button>
                    )}
                    <button
                      onClick={closeModal}
                      style={{
                        flex: isStudent ? undefined : 1,
                        padding: "13px 20px", background: "#f1f5f9",
                        color: "#475569", border: "none", borderRadius: "12px",
                        fontSize: "14px", fontWeight: "600", cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
              to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

const sectionHead = {
  margin: "0 0 10px", fontSize: "13px", fontWeight: "800",
  color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em",
};
