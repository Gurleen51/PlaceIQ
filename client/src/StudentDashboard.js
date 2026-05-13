import React, { useEffect, useState, useRef } from "react";
import ResumeUpload from "./ResumeUpload";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: localStorage.getItem("token") || "",
});

const scoreColor = (pct) => {
  if (pct >= 80) return { bar: "#22c55e", text: "#15803d", bg: "#dcfce7" };
  if (pct >= 60) return { bar: "#3B82F6", text: "#1d4ed8", bg: "#dbeafe" };
  if (pct >= 40) return { bar: "#F59E0B", text: "#92400e", bg: "#fef3c7" };
  return          { bar: "#EF4444", text: "#b91c1c", bg: "#fee2e2" };
};

function getRequiredSkills(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("full stack"))        return ["HTML","CSS","JavaScript","React","Node.js"];
  if (t.includes("frontend"))          return ["HTML","CSS","JavaScript","React"];
  if (t.includes("backend"))           return ["Node.js","Express","MongoDB","SQL"];
  if (t.includes("data engineer"))     return ["Python","SQL","ETL","Spark"];
  if (t.includes("data analyst"))      return ["Excel","SQL","Python","Power BI"];
  if (t.includes("software engineer")) return ["Java","JavaScript","DSA"];
  if (t.includes("java"))              return ["Java","Spring","SQL"];
  if (t.includes("python"))            return ["Python","Django","Flask"];
  if (t.includes("designer"))          return ["Figma","UI","UX","Wireframe"];
  if (t.includes("devops"))            return ["Docker","Kubernetes","CI/CD","Linux"];
  if (t.includes("cloud"))             return ["AWS","Azure","GCP","Terraform"];
  if (t.includes("ml"))                return ["Python","ML","TensorFlow","Pandas"];
  return ["Communication","Problem Solving"];
}

const ROLE_OPTIONS = [
  "Full Stack Developer","Frontend Developer","Backend Developer",
  "Data Analyst","Data Engineer","Software Engineer",
  "Java Developer","Python Developer","UI/UX Designer",
  "DevOps Engineer","Cloud Engineer","ML Engineer",
];

const INTERNSHIP_OPTIONS = [
  { value: "none",      label: "No internship" },
  { value: "ongoing",   label: "Currently doing internship" },
  { value: "completed", label: "Completed internship" },
];

/* ════════════════════════════════════════
   JOB CARD
════════════════════════════════════════ */
function JobCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const pct         = item.overall_match_pct || 0;
  const sc          = scoreColor(pct);
  const matchedList = (item.matched_skills           || "").split(",").map(s => s.trim()).filter(Boolean);
  const missingList = (item.missing_mandatory_skills || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <div onClick={() => setExpanded(e => !e)} style={{
        padding: "18px 22px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{item.job_title}</h3>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "#EFF6FF", color: "#1D4ED8", fontWeight: "700" }}>
              #{item.recommendation_rank}
            </span>
          </div>
          <p style={{ margin: "3px 0 6px", fontSize: "13px", color: "#64748b" }}>
            🏢 {item.company_name} &nbsp;·&nbsp; 📍 {item.location}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, background: "#f1f5f9", height: "6px", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: sc.bar, borderRadius: "6px" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: "800", color: sc.text, whiteSpace: "nowrap" }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
          <span style={{ padding: "4px 11px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: sc.bg, color: sc.text, whiteSpace: "nowrap" }}>
            {item.eligible === "Yes" ? "✓ Eligible" : "⚠ Needs Skills"}
          </span>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{expanded ? "▲ Less" : "▼ Details"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 22px 18px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: "18px", margin: "14px 0 12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "#475569" }}>
              💰 {item.salary && item.salary !== "N/A" ? `${item.salary} LPA` : "Salary not listed"}
            </span>
            <span style={{ fontSize: "13px", color: "#475569" }}>
              👥 {item.openings && item.openings !== "N/A" ? `${item.openings} openings` : "Openings not listed"}
            </span>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skill Match</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {matchedList.map((sk, j) => (
              <span key={j} style={{ padding: "4px 11px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: "#dcfce7", color: "#15803d" }}>✓ {sk}</span>
            ))}
            {missingList.map((sk, j) => (
              <span key={j} style={{ padding: "4px 11px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: "#fee2e2", color: "#b91c1c" }}>✗ {sk}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   PLACEMENT REPORT  (printable + download)
════════════════════════════════════════ */
function PlacementReport({ profile, matches }) {
  const reportRef = useRef();
  const [reportData, setReportData] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/my-report", {
      headers: { Authorization: localStorage.getItem("token") || "" },
    })
      .then(r => r.json())
      .then(data => { setReportData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* ── Download as PDF — opens print dialog with PDF-optimised styles ── */
  const downloadReport = () => {
    const html = buildReportHTML(reportData || buildFallbackReport(profile, matches));
    const win  = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    /* Short delay lets the browser render before print dialog opens.
       User selects "Save as PDF" in the print dialog. */
    setTimeout(() => {
      win.print();
      /* Close the tab after the dialog closes (doesn't work on all browsers) */
      win.onafterprint = () => win.close();
    }, 600);
  };

  /* ── Print ── */
  const printReport = () => {
    const html = buildReportHTML(reportData || buildFallbackReport(profile, matches));
    const win  = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
      <div style={{ fontSize: "28px", marginBottom: "10px" }}>📋</div>
      Generating your placement report…
    </div>
  );

  const rd = reportData || buildFallbackReport(profile, matches);

  /* ── Internship label ── */
  const internshipLabel =
    rd.profile.internship_status === "completed" ? "✅ Completed" :
    rd.profile.internship_status === "ongoing"   ? "🔄 Ongoing"  : "❌ None";

  const aptLabel =
    rd.profile.cgpa == null            ? "—" :
    rd.profile.cgpa >= 8              ? `${rd.profile.cgpa} / 10  ✅ Great` :
    rd.profile.cgpa >= 6              ? `${rd.profile.cgpa} / 10  ⚠ Average` :
    `${rd.profile.cgpa} / 10  ❌ Low`;

  const certList = (rd.profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean);
  const skillList = (rd.profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div>
      {/* ── Action toolbar ── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>📋 Placement Report</h3>
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
            Generated on {new Date(rd.generated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <button onClick={printReport} style={toolBtn("#EFF6FF", "#1D4ED8")}>🖨 Print</button>
        <button onClick={downloadReport} style={toolBtn("#0f172a", "#fff")}>⬇ Download PDF</button>
      </div>

      <div ref={reportRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── Header card ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          borderRadius: "16px", padding: "26px 28px",
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: "11px", color: "#6EE7B7", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              PlaceIQ · Placement Report
            </p>
            <h2 style={{ margin: "6px 0 4px", fontSize: "24px", fontWeight: "900", color: "#fff", letterSpacing: "-0.03em" }}>
              {rd.profile.name}
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#93C5FD" }}>
              {rd.profile.preferred_role || "Student"}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
              {rd.profile.email} · {rd.profile.education || "Education not specified"}
            </p>
          </div>
          {/* Mini analytics */}
          <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
            {[
              { label: "Matches",  value: rd.analytics.total_matches,  color: "#6EE7B7" },
              { label: "Eligible", value: rd.analytics.eligible_jobs,   color: "#93C5FD" },
              { label: "Avg Score",value: `${rd.analytics.avg_match_score}%`, color: "#FCD34D" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: "900", color: s.color, letterSpacing: "-0.04em" }}>{s.value}</p>
                <p style={{ margin: "2px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two column grid: profile + aptitude/internship ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Skills */}
          <ReportSection title="🧠 Skills" icon="">
            {skillList.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {skillList.map((sk, i) => (
                  <span key={i} style={chip("#EFF6FF", "#1D4ED8")}>{sk}</span>
                ))}
              </div>
            ) : <Gray>No skills listed.</Gray>}
          </ReportSection>

          {/* Certifications */}
          <ReportSection title="🏅 Certifications">
            {certList.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {certList.map((c, i) => (
                  <span key={i} style={chip("#F0FDF4", "#15803d")}>{c}</span>
                ))}
              </div>
            ) : <Gray>No certifications listed.</Gray>}
          </ReportSection>

          {/* Aptitude */}
          <ReportSection title="📊 CGPA">
            {rd.profile.cgpa != null ? (
              <>
                <p style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: "900", color: rd.profile.cgpa >= 8 ? "#15803d" : rd.profile.cgpa >= 6 ? "#92400e" : "#b91c1c", letterSpacing: "-0.04em" }}>
                  {rd.profile.cgpa}<span style={{ fontSize: "14px", fontWeight: "600", color: "#94a3b8" }}> / 10</span>
                </p>
                <div style={{ background: "#f1f5f9", height: "8px", borderRadius: "8px", overflow: "hidden" }}>
                  <div style={{
                    width: `${rd.profile.cgpa * 10}%`, height: "100%", borderRadius: "8px",
                    background: rd.profile.cgpa >= 8 ? "#22c55e" : rd.profile.cgpa >= 6 ? "#F59E0B" : "#EF4444",
                  }} />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
                  {rd.profile.cgpa >= 8 ? "Excellent" : rd.profile.cgpa >= 6 ? "Good — scope for improvement" : "Needs improvement"}
                </p>
              </>
            ) : <Gray>CGPA not provided.</Gray>}
          </ReportSection>

          {/* Internship */}
          <ReportSection title="💼 Internship Status">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                fontSize: "14px", fontWeight: "700", padding: "6px 14px", borderRadius: "20px",
                background: rd.profile.internship_status === "completed" ? "#dcfce7" :
                            rd.profile.internship_status === "ongoing"   ? "#dbeafe" : "#f1f5f9",
                color:      rd.profile.internship_status === "completed" ? "#15803d" :
                            rd.profile.internship_status === "ongoing"   ? "#1d4ed8" : "#64748b",
              }}>
                {internshipLabel}
              </span>
            </div>
            {rd.profile.internship_status === "none" && (
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Consider completing an internship to strengthen your placement profile.
              </p>
            )}
          </ReportSection>
        </div>

        {/* ── Projects ── */}
        {rd.profile.projects && (
          <ReportSection title="🛠 Projects">
            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.7", whiteSpace: "pre-line" }}>
              {rd.profile.projects}
            </p>
          </ReportSection>
        )}

        {/* ── Experience ── */}
        <ReportSection title="🎓 Education & Experience">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { label: "Education",  value: rd.profile.education  },
              { label: "Experience", value: rd.profile.experience },
            ].map((f, i) => (
              <div key={i} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</p>
                <p style={{ margin: "5px 0 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{f.value || "Not specified"}</p>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* ── Skill Gaps ── */}
        {rd.analytics.top_skill_gaps && rd.analytics.top_skill_gaps.length > 0 && (
          <ReportSection title="🔍 Top Skill Gaps">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {rd.analytics.top_skill_gaps.map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    minWidth: "120px", fontSize: "13px", fontWeight: "700",
                    color: "#0f172a", textTransform: "capitalize",
                  }}>{g.skill}</span>
                  <div style={{ flex: 1, background: "#f1f5f9", height: "6px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, (g.count / (rd.analytics.total_matches || 1)) * 100)}%`,
                      height: "100%", borderRadius: "6px",
                      background: i === 0 ? "#EF4444" : i <= 2 ? "#F59E0B" : "#94a3b8",
                    }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b", minWidth: "80px", textAlign: "right" }}>
                    {g.count} job{g.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </ReportSection>
        )}

        {/* ── Top Job Matches ── */}
        {rd.top_matches && rd.top_matches.length > 0 && (
          <ReportSection title="🎯 Top Job Matches">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {rd.top_matches.map((m, i) => {
                const sc = scoreColor(m.overall_match_pct || 0);
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", background: "#f8fafc",
                    borderRadius: "10px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "8px",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{m.job_title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                        {m.company_name} · {m.location} {m.salary && m.salary !== "N/A" ? `· ${m.salary} LPA` : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: sc.text }}>{m.overall_match_pct}%</span>
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: sc.bg, color: sc.text, fontWeight: "700" }}>
                        {m.eligible === "Yes" ? "✓ Eligible" : "⚠ Needs Skills"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportSection>
        )}

        {/* ── Footer note ── */}
        <div style={{ textAlign: "center", padding: "14px", fontSize: "12px", color: "#94a3b8" }}>
          Generated by PlaceIQ · {new Date(rd.generated_at).toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}

/* ── Build standalone HTML report for download / print ── */
function buildReportHTML(rd) {
  const skillList = (rd.profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const certList  = (rd.profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean);

  const internshipLabel =
    rd.profile.internship_status === "completed" ? "✅ Completed" :
    rd.profile.internship_status === "ongoing"   ? "🔄 Ongoing"  : "❌ None";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Placement Report — ${rd.profile.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; padding: 32px; }
  .page { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0f172a, #1e3a5f); border-radius: 14px; padding: 28px 32px; color: #fff; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
  .header h1 { font-size: 26px; font-weight: 900; letter-spacing: -0.03em; margin: 6px 0 4px; }
  .header .role { font-size: 14px; color: #93C5FD; }
  .header .sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 6px; }
  .header .badge { font-size: 11px; color: #6EE7B7; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
  .stats { display: flex; gap: 24px; }
  .stat { text-align: center; }
  .stat .val { font-size: 28px; font-weight: 900; letter-spacing: -0.04em; }
  .stat .lbl { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; margin-top: 2px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 16px; }
  .section h3 { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }
  .chip { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 3px; }
  .chip-blue { background: #EFF6FF; color: #1D4ED8; }
  .chip-green { background: #F0FDF4; color: #15803d; }
  .row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .bar-track { flex: 1; background: #f1f5f9; height: 6px; border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 6px; }
  .match-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 8px; }
  .badge-pill { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 700; }
  .info-cell { padding: 12px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
  .info-cell .lbl { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .info-cell .val { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px; }
  .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; }
  @media print {
    @page { margin: 15mm 12mm; size: A4; }
    body { background: #fff !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; max-width: 100% !important; }
    .section { break-inside: avoid; }
    .grid2 { break-inside: avoid; }
    .match-row { break-inside: avoid; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <p class="badge">PlaceIQ · Placement Report</p>
      <h1>${rd.profile.name}</h1>
      <p class="role">${rd.profile.preferred_role || "Student"}</p>
      <p class="sub">${rd.profile.email} · ${rd.profile.education || "Education not specified"}</p>
    </div>
    <div class="stats">
      <div class="stat"><div class="val" style="color:#6EE7B7">${rd.analytics.total_matches}</div><div class="lbl">Matches</div></div>
      <div class="stat"><div class="val" style="color:#93C5FD">${rd.analytics.eligible_jobs}</div><div class="lbl">Eligible</div></div>
      <div class="stat"><div class="val" style="color:#FCD34D">${rd.analytics.avg_match_score}%</div><div class="lbl">Avg Score</div></div>
    </div>
  </div>

  <!-- Skills & Certs -->
  <div class="grid2">
    <div class="section">
      <h3>🧠 Skills</h3>
      ${skillList.length > 0
        ? skillList.map(sk => `<span class="chip chip-blue">${sk}</span>`).join("")
        : "<p style='color:#94a3b8;font-size:13px'>No skills listed.</p>"}
    </div>
    <div class="section">
      <h3>🏅 Certifications</h3>
      ${certList.length > 0
        ? certList.map(c => `<span class="chip chip-green">${c}</span>`).join("")
        : "<p style='color:#94a3b8;font-size:13px'>No certifications listed.</p>"}
    </div>
  </div>

  <!-- Aptitude & Internship -->
  <div class="grid2">
    <div class="section">
      <h3>📊 CGPA</h3>
      ${rd.profile.cgpa != null
        ? `<p style="font-size:32px;font-weight:900;color:${rd.profile.cgpa >= 8 ? "#15803d" : rd.profile.cgpa >= 6 ? "#92400e" : "#b91c1c"};letter-spacing:-0.04em;margin-bottom:8px">${rd.profile.cgpa}<span style="font-size:14px;color:#94a3b8;font-weight:600"> / 10</span></p>
           <div class="bar-track"><div class="bar-fill" style="width:${rd.profile.cgpa * 10}%;background:${rd.profile.cgpa >= 8 ? "#22c55e" : rd.profile.cgpa >= 6 ? "#F59E0B" : "#EF4444"}"></div></div>
           <p style="margin-top:6px;font-size:12px;color:#64748b">${rd.profile.cgpa >= 8 ? "Excellent" : rd.profile.cgpa >= 6 ? "Good — scope for improvement" : "Needs improvement"}</p>`
        : "<p style='color:#94a3b8;font-size:13px'>Not provided.</p>"}
    </div>
    <div class="section">
      <h3>💼 Internship Status</h3>
      <p style="font-size:15px;font-weight:700;margin-bottom:6px">${internshipLabel}</p>
      <p style="font-size:12px;color:#64748b">${
        rd.profile.internship_status === "completed" ? "Great — internship experience boosts placement chances." :
        rd.profile.internship_status === "ongoing"   ? "Currently doing an internship." :
        "No internship yet. Consider applying for one."
      }</p>
    </div>
  </div>

  <!-- Projects -->
  ${rd.profile.projects ? `
  <div class="section">
    <h3>🛠 Projects</h3>
    <p style="font-size:14px;color:#475569;line-height:1.7;white-space:pre-line">${rd.profile.projects}</p>
  </div>` : ""}

  <!-- Education & Experience -->
  <div class="section">
    <h3>🎓 Education & Experience</h3>
    <div class="grid2" style="margin-bottom:0">
      <div class="info-cell"><div class="lbl">Education</div><div class="val">${rd.profile.education || "Not specified"}</div></div>
      <div class="info-cell"><div class="lbl">Experience</div><div class="val">${rd.profile.experience || "Not specified"}</div></div>
    </div>
  </div>

  <!-- Skill Gaps -->
  ${rd.analytics.top_skill_gaps && rd.analytics.top_skill_gaps.length > 0 ? `
  <div class="section">
    <h3>🔍 Top Skill Gaps</h3>
    ${rd.analytics.top_skill_gaps.map((g, i) => `
      <div class="row">
        <span style="min-width:120px;font-size:13px;font-weight:700;text-transform:capitalize">${g.skill}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, (g.count / (rd.analytics.total_matches || 1)) * 100)}%;background:${i === 0 ? "#EF4444" : i <= 2 ? "#F59E0B" : "#94a3b8"}"></div></div>
        <span style="font-size:12px;color:#64748b;min-width:60px;text-align:right">${g.count} jobs</span>
      </div>`).join("")}
  </div>` : ""}

  <!-- Top Matches -->
  ${rd.top_matches && rd.top_matches.length > 0 ? `
  <div class="section">
    <h3>🎯 Top Job Matches</h3>
    ${rd.top_matches.map(m => {
      const bg    = m.overall_match_pct >= 80 ? "#dcfce7" : m.overall_match_pct >= 60 ? "#dbeafe" : m.overall_match_pct >= 40 ? "#fef3c7" : "#fee2e2";
      const clr   = m.overall_match_pct >= 80 ? "#15803d" : m.overall_match_pct >= 60 ? "#1d4ed8" : m.overall_match_pct >= 40 ? "#92400e" : "#b91c1c";
      return `<div class="match-row">
        <div>
          <p style="font-size:14px;font-weight:700;color:#0f172a">${m.job_title}</p>
          <p style="font-size:12px;color:#64748b;margin-top:2px">${m.company_name} · ${m.location}${m.salary && m.salary !== "N/A" ? " · " + m.salary + " LPA" : ""}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:14px;font-weight:800;color:${clr}">${m.overall_match_pct}%</span>
          <span class="badge-pill" style="background:${bg};color:${clr}">${m.eligible === "Yes" ? "✓ Eligible" : "⚠ Needs Skills"}</span>
        </div>
      </div>`;
    }).join("")}
  </div>` : ""}

  <p class="footer">Generated by PlaceIQ · ${new Date(rd.generated_at).toLocaleString("en-IN")}</p>
</div>
</body>
</html>`;
}

function buildFallbackReport(profile, matches) {
  const eligible = matches.filter(m => m.eligible === "Yes").length;
  const avgScore = matches.length
    ? Math.round(matches.reduce((s, m) => s + (m.overall_match_pct || 0), 0) / matches.length)
    : 0;
  const gapFreq = {};
  matches.forEach(m =>
    (m.missing_mandatory_skills || "").split(",").map(s => s.trim()).filter(Boolean)
      .forEach(sk => { gapFreq[sk] = (gapFreq[sk] || 0) + 1; })
  );
  return {
    profile,
    analytics: {
      total_matches: matches.length, eligible_jobs: eligible, avg_match_score: avgScore,
      top_skill_gaps: Object.entries(gapFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([skill, count]) => ({ skill, count })),
    },
    top_matches: matches.slice(0, 5).map(m => ({
      company_name: m.company_name, job_title: m.job_title, location: m.location,
      salary: m.salary, overall_match_pct: m.overall_match_pct, eligible: m.eligible,
    })),
    generated_at: new Date().toISOString(),
  };
}

/* ── Tiny helpers ── */
function ReportSection({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", border: "1px solid #e2e8f0" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
function Gray({ children }) {
  return <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{children}</p>;
}
function chip(bg, color) {
  return { padding: "4px 12px", borderRadius: "20px", background: bg, color, fontSize: "12px", fontWeight: "600" };
}
function toolBtn(bg, color) {
  return { padding: "9px 18px", background: bg, color, border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer" };
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function StudentDashboard() {
  const [profile,   setProfile]   = useState({});
  const [matches,   setMatches]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("matches");

  const [editing,  setEditing]  = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    const headers = { Authorization: localStorage.getItem("token") || "" };
    Promise.all([
      fetch("http://localhost:5000/my-profile",           { headers }).then(r => r.json()),
      fetch("http://localhost:5000/my-dashboard-matches", { headers }).then(r => r.json()),
    ])
      .then(([profileData, matchData]) => {
        if (!profileData.error) {
          setProfile(profileData);
          setEditForm({
            name:              profileData.name              || "",
            skills:            profileData.skills            || "",
            education:         profileData.education         || "",
            experience:        profileData.experience        || "",
            preferred_role:    profileData.preferred_role    || "",
            certifications:    profileData.certifications    || "",
            projects:          profileData.projects          || "",
            cgpa:    profileData.cgpa    ?? "",
            internship_status: profileData.internship_status || "none",
          });
        }
        setMatches(Array.isArray(matchData) ? matchData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const saveProfile = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const res  = await fetch("http://localhost:5000/update-profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          ...editForm,
          cgpa: editForm.cgpa !== "" ? Number(editForm.cgpa) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg("✓ Profile updated successfully!");
        localStorage.setItem("skills",         editForm.skills         || "");
        localStorage.setItem("preferred_role", editForm.preferred_role || "");
        setEditing(false);
        loadData();
      } else {
        setSaveMsg("⚠ " + (data.error || "Update failed."));
      }
    } catch {
      setSaveMsg("⚠ Server error. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  const eligible    = matches.filter(m => m.eligible === "Yes");
  const needsSkills = matches.filter(m => m.eligible !== "Yes");
  const skillList   = (profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const avgScore    = matches.length
    ? Math.round(matches.reduce((s, m) => s + (m.overall_match_pct || 0), 0) / matches.length)
    : 0;

  const gapFreq = {};
  matches.forEach(m =>
    (m.missing_mandatory_skills || "").split(",").map(s => s.trim()).filter(Boolean)
      .forEach(sk => { gapFreq[sk] = (gapFreq[sk] || 0) + 1; })
  );
  const topGaps = Object.entries(gapFreq).sort((a, b) => b[1] - a[1]);

  const allRequired = [...new Set(matches.flatMap(m => getRequiredSkills(m.job_title)))];
  const ownedSet    = new Set(skillList.map(s => s.toLowerCase()));
  const notOwned    = allRequired.filter(sk => !ownedSet.has(sk.toLowerCase()));
  const owned       = allRequired.filter(sk => ownedSet.has(sk.toLowerCase()));
  const readiness   = allRequired.length ? Math.round((owned.length / allRequired.length) * 100) : 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        borderRadius: "18px", padding: "24px 28px",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px",
      }}>
        <div>
          <p style={{ margin: 0, fontSize: "12px", color: "#6EE7B7", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>Student Portal</p>
          <h2 style={{ margin: "6px 0 4px", fontSize: "22px", fontWeight: "800", color: "#fff", letterSpacing: "-0.03em" }}>
            Welcome back, {profile.name || "Student"} 👋
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
            {profile.preferred_role ? `Showing ${profile.preferred_role} jobs` : "Set your preferred role for personalised matches"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { label: "Matched Jobs", value: matches.length,  color: "#6EE7B7" },
            { label: "Eligible",     value: eligible.length, color: "#93C5FD" },
            { label: "Avg Score",    value: `${avgScore}%`,  color: "#FCD34D" },
            { label: "Readiness",    value: `${readiness}%`, color: "#F9A8D4" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: s.color, letterSpacing: "-0.04em" }}>{s.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "matches",  label: "🎯 Job Matches" },
          { key: "profile",  label: "🎓 My Profile" },
          { key: "skillgap", label: "🧠 Skill Gap" },
          { key: "resume",   label: "📄 Resume" },
          { key: "report",   label: "📋 Report" },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "8px 18px", borderRadius: "10px", fontSize: "13px",
            fontWeight: "600", cursor: "pointer", border: "none",
            background: activeTab === t.key ? "#0f172a" : "#f1f5f9",
            color:      activeTab === t.key ? "#fff"    : "#64748b",
            transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: JOB MATCHES ══ */}
      {activeTab === "matches" && (
        loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading matches…</div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "32px", margin: "0 0 10px" }}>🔍</p>
            <p style={{ margin: 0, fontWeight: "700", color: "#0f172a" }}>No preferred-role jobs found</p>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#94a3b8" }}>Set your <strong>Preferred Role</strong> in the Profile tab and reload.</p>
          </div>
        ) : (
          <div>
            {eligible.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Eligible Jobs</h3>
                  <span style={{ fontSize: "12px", padding: "2px 10px", borderRadius: "20px", background: "#dcfce7", color: "#15803d", fontWeight: "700" }}>{eligible.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {eligible.map((item, i) => <JobCard key={item._id || i} item={item} />)}
                </div>
              </div>
            )}
            {needsSkills.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Needs More Skills</h3>
                  <span style={{ fontSize: "12px", padding: "2px 10px", borderRadius: "20px", background: "#fef3c7", color: "#92400e", fontWeight: "700" }}>{needsSkills.length}</span>
                </div>
                {topGaps.length > 0 && (
                  <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: "12px", padding: "14px 18px", marginBottom: "12px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6EE7B7", fontWeight: "700", flexShrink: 0 }}>💡 Learn to unlock more jobs:</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {topGaps.slice(0, 5).map(([sk, cnt], i) => (
                        <span key={i} style={{ padding: "3px 11px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", fontWeight: "600", textTransform: "capitalize" }}>
                          {sk} <span style={{ color: "#FCD34D" }}>×{cnt}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {needsSkills.map((item, i) => <JobCard key={item._id || i} item={item} />)}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ══ TAB: MY PROFILE ══ */}
      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {saveMsg && (
            <div style={{ padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", background: saveMsg.startsWith("✓") ? "#dcfce7" : "#FEF2F2", color: saveMsg.startsWith("✓") ? "#15803d" : "#DC2626", border: saveMsg.startsWith("✓") ? "1px solid #86efac" : "1px solid #FECACA" }}>
              {saveMsg}
            </div>
          )}

          {/* Profile Card */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #6EE7B7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "#0f172a", flexShrink: 0 }}>
                  {(profile.name || "S")[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>{profile.name}</h3>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#3B82F6", fontWeight: "600" }}>{profile.preferred_role || "No preferred role set"}</p>
                </div>
              </div>
              <button onClick={() => { setEditing(e => !e); setSaveMsg(""); }} style={{ padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", border: "none", background: editing ? "#f1f5f9" : "#0f172a", color: editing ? "#64748b" : "#fff" }}>
                {editing ? "Cancel" : "✏️ Edit Profile"}
              </button>
            </div>

            {!editing ? (
              /* ── VIEW MODE ── */
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                  {[
                    { label: "Full Name",      value: profile.name,           icon: "👤" },
                    { label: "Email",          value: profile.email,          icon: "📧" },
                    { label: "Education",      value: profile.education,      icon: "🎓" },
                    { label: "Experience",     value: profile.experience,     icon: "💼" },
                    { label: "Preferred Role", value: profile.preferred_role, icon: "🎯" },
                  ].map((f, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.icon} {f.label}</p>
                      <p style={{ margin: "5px 0 0", fontSize: "14px", fontWeight: "600", color: f.label === "Preferred Role" ? "#2563eb" : "#0f172a" }}>
                        {f.value || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>Not set</span>}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Extra fields view */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>📊 CGPA</p>
                    <p style={{ margin: "5px 0 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                      {profile.cgpa != null ? `${profile.cgpa} / 10` : <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>Not set</span>}
                    </p>
                  </div>
                  <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>💼 Internship</p>
                    <p style={{ margin: "5px 0 0", fontSize: "14px", fontWeight: "600", color: profile.internship_status === "completed" ? "#15803d" : profile.internship_status === "ongoing" ? "#1d4ed8" : "#64748b" }}>
                      {profile.internship_status === "completed" ? "✅ Completed" : profile.internship_status === "ongoing" ? "🔄 Ongoing" : "❌ None"}
                    </p>
                  </div>
                  <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", gridColumn: "span 2" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>🏅 Certifications</p>
                    {(profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean).length > 0
                      ? <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {(profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean).map((c, i) => (
                            <span key={i} style={{ padding: "3px 10px", borderRadius: "20px", background: "#F0FDF4", color: "#15803d", fontSize: "12px", fontWeight: "600" }}>{c}</span>
                          ))}
                        </div>
                      : <span style={{ fontSize: "14px", color: "#cbd5e1", fontStyle: "italic" }}>Not set</span>}
                  </div>
                  {profile.projects && (
                    <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", gridColumn: "1 / -1" }}>
                      <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>🛠 Projects</p>
                      <p style={{ margin: 0, fontSize: "14px", color: "#0f172a", lineHeight: "1.6", whiteSpace: "pre-line" }}>{profile.projects}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── EDIT MODE ── */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <FormField label="Full Name" icon="👤">
                  <input style={inputSt} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                </FormField>
                <FormField label="Education" icon="🎓">
                  <input style={inputSt} value={editForm.education} onChange={e => setEditForm(f => ({ ...f, education: e.target.value }))} placeholder="e.g. B.Tech CSE, 2025" />
                </FormField>
                <FormField label="Experience" icon="💼">
                  <input style={inputSt} value={editForm.experience} onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))} placeholder="Fresher / 1 year internship" />
                </FormField>
                <FormField label="Preferred Role" icon="🎯">
                  <select style={{ ...inputSt, cursor: "pointer" }} value={editForm.preferred_role} onChange={e => setEditForm(f => ({ ...f, preferred_role: e.target.value }))}>
                    <option value="">— Select a role —</option>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </FormField>
                <FormField label="CGPA (0–10)" icon="📊">
                  <input style={inputSt} type="number" min="0" max="10" step="0.1" value={editForm.cgpa} onChange={e => setEditForm(f => ({ ...f, cgpa: e.target.value }))} placeholder="e.g. 8.5" />
                </FormField>
                <FormField label="Internship Status" icon="💼">
                  <select style={{ ...inputSt, cursor: "pointer" }} value={editForm.internship_status} onChange={e => setEditForm(f => ({ ...f, internship_status: e.target.value }))}>
                    {INTERNSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Skills (comma-separated)" icon="🧠" fullWidth>
                  <input style={inputSt} value={editForm.skills} onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))} placeholder="Python, React, SQL, Excel…" />
                  {editForm.skills && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
                      {editForm.skills.split(",").map(s => s.trim()).filter(Boolean).map((sk, i) => (
                        <span key={i} style={{ padding: "3px 10px", borderRadius: "20px", background: "#EFF6FF", color: "#1D4ED8", fontSize: "12px", fontWeight: "600" }}>{sk}</span>
                      ))}
                    </div>
                  )}
                </FormField>
                <FormField label="Certifications (comma-separated)" icon="🏅" fullWidth>
                  <input style={inputSt} value={editForm.certifications} onChange={e => setEditForm(f => ({ ...f, certifications: e.target.value }))} placeholder="AWS Cloud Practitioner, Google Analytics…" />
                </FormField>
                <FormField label="Projects" icon="🛠" fullWidth>
                  <textarea style={{ ...inputSt, minHeight: "80px", resize: "vertical", lineHeight: "1.6" }} value={editForm.projects} onChange={e => setEditForm(f => ({ ...f, projects: e.target.value }))} placeholder="Describe your key projects…" />
                </FormField>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "4px" }}>
                  <button onClick={saveProfile} disabled={saving} style={{ padding: "11px 28px", background: saving ? "#94a3b8" : "linear-gradient(135deg, #3B82F6, #2563eb)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "Saving…" : "Save Changes ✓"}
                  </button>
                  <button onClick={() => setEditing(false)} style={{ padding: "11px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Skills showcase */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>🧠 Your Skills</h3>
            {skillList.length > 0
              ? <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {skillList.map((sk, i) => <span key={i} style={{ padding: "6px 14px", borderRadius: "20px", background: "#EFF6FF", color: "#1D4ED8", fontSize: "13px", fontWeight: "600", border: "1px solid #BFDBFE" }}>{sk}</span>)}
                </div>
              : <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>No skills listed. Click <strong>Edit Profile</strong> to add your skills.</p>}
          </div>
        </div>
      )}

      {/* ══ TAB: SKILL GAP ══ */}
      {activeTab === "skillgap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#6EE7B7", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall Skill Readiness</p>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>Based on {matches.length} {profile.preferred_role || "preferred role"} jobs</p>
              </div>
              <p style={{ margin: 0, fontSize: "42px", fontWeight: "900", color: readiness >= 60 ? "#6EE7B7" : readiness >= 40 ? "#FCD34D" : "#FCA5A5", letterSpacing: "-0.05em" }}>{readiness}%</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", height: "10px", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ width: `${readiness}%`, height: "100%", borderRadius: "10px", background: readiness >= 60 ? "#6EE7B7" : readiness >= 40 ? "#FCD34D" : "#FCA5A5", transition: "width 0.6s ease" }} />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>You have {owned.length} of {allRequired.length} unique skills required across all your job matches</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "800", color: "#15803d" }}>✅ Skills You Have ({owned.length})</h3>
              {owned.length > 0
                ? <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>{owned.map((sk, i) => <span key={i} style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>✓ {sk}</span>)}</div>
                : <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>No matching skills found yet.</p>}
            </div>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "800", color: "#b91c1c" }}>❌ Skills to Learn ({notOwned.length})</h3>
              {notOwned.length > 0
                ? <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>{notOwned.map((sk, i) => <span key={i} style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}>✗ {sk}</span>)}</div>
                : <p style={{ margin: 0, fontSize: "13px", color: "#15803d", fontWeight: "600" }}>🎉 You have all required skills!</p>}
            </div>
          </div>

          {topGaps.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>📊 Skill Gap Priority</h3>
              <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#64748b" }}>Skills missing most frequently — learn these first for maximum impact</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {topGaps.map(([sk, cnt], i) => {
                  const barPct   = Math.round((cnt / matches.length) * 100);
                  const priority = i === 0 ? { bg: "#fef2f2", badge: "#fee2e2", badgeText: "#b91c1c", label: "🔥 High Priority" }
                                 : i <= 2  ? { bg: "#fffbeb", badge: "#fef3c7", badgeText: "#92400e", label: "⚡ Medium" }
                                 :           { bg: "#f8fafc", badge: "#f1f5f9", badgeText: "#475569", label: "📌 Learn" };
                  return (
                    <div key={i} style={{ background: priority.bg, borderRadius: "12px", padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", textTransform: "capitalize" }}>{sk}</span>
                          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: priority.badge, color: priority.badgeText, fontWeight: "700" }}>{priority.label}</span>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>{cnt} / {matches.length} jobs</span>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.06)", height: "6px", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${barPct}%`, height: "100%", borderRadius: "6px", background: i === 0 ? "#EF4444" : i <= 2 ? "#F59E0B" : "#94a3b8", transition: "width 0.5s ease" }} />
                      </div>
                      <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#64748b" }}>Missing in {barPct}% of your matched jobs</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: "14px", padding: "18px 22px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "700", color: "#6EE7B7" }}>🚀 Next Steps</p>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>Once you learn a new skill, go to <strong style={{ color: "#fff" }}>Edit Profile</strong> → update your Skills field → your matches will regenerate automatically.</p>
            </div>
            <button onClick={() => setActiveTab("profile")} style={{ padding: "10px 18px", background: "#6EE7B7", color: "#0f172a", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>Update Skills →</button>
          </div>
        </div>
      )}

      {/* ══ TAB: RESUME ══ */}
      {activeTab === "resume" && (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", border: "1px solid #e2e8f0", maxWidth: "480px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>📄 Upload Your Resume</h3>
          <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#64748b" }}>Upload a PDF resume to complete your placement profile. Max 5 MB.</p>
          <ResumeUpload userId={profile.user_id} />
        </div>
      )}

      {/* ══ TAB: REPORT ══ */}
      {activeTab === "report" && (
        <PlacementReport profile={profile} matches={matches} />
      )}
    </div>
  );
}

function FormField({ label, icon, children, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

const inputSt = {
  width: "100%", padding: "10px 13px", boxSizing: "border-box",
  border: "1.5px solid #e2e8f0", borderRadius: "10px",
  fontSize: "14px", color: "#0f172a", outline: "none", background: "#f8fafc",
};