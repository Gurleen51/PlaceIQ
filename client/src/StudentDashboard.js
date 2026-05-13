import React, { useEffect, useState } from "react";
import ResumeUpload from "./ResumeUpload";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
    <div style={{ background:"#fff", borderRadius:"16px", border:"1px solid #e2e8f0", overflow:"hidden" }}>
      <div onClick={() => setExpanded(e => !e)} style={{
        padding:"18px 22px", cursor:"pointer",
        display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px",
      }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <h3 style={{ margin:0, fontSize:"15px", fontWeight:"700", color:"#0f172a" }}>{item.job_title}</h3>
            <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"20px", background:"#EFF6FF", color:"#1D4ED8", fontWeight:"700" }}>
              #{item.recommendation_rank}
            </span>
          </div>
          <p style={{ margin:"3px 0 6px", fontSize:"13px", color:"#64748b" }}>
            🏢 {item.company_name} &nbsp;·&nbsp; 📍 {item.location}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ flex:1, background:"#f1f5f9", height:"6px", borderRadius:"6px", overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:sc.bar, borderRadius:"6px" }} />
            </div>
            <span style={{ fontSize:"12px", fontWeight:"800", color:sc.text }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px", flexShrink:0 }}>
          <span style={{ padding:"4px 11px", borderRadius:"20px", fontSize:"12px", fontWeight:"700", background:sc.bg, color:sc.text, whiteSpace:"nowrap" }}>
            {item.eligible === "Yes" ? "✓ Eligible" : "⚠ Needs Skills"}
          </span>
          <span style={{ fontSize:"11px", color:"#94a3b8" }}>{expanded ? "▲" : "▼"} Details</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding:"0 22px 18px", borderTop:"1px solid #f1f5f9" }}>
          <div style={{ display:"flex", gap:"18px", margin:"12px 0", flexWrap:"wrap" }}>
            <span style={{ fontSize:"13px", color:"#475569" }}>💰 {item.salary && item.salary !== "N/A" ? `${item.salary} LPA` : "Not listed"}</span>
            <span style={{ fontSize:"13px", color:"#475569" }}>👥 {item.openings && item.openings !== "N/A" ? `${item.openings} openings` : "Not listed"}</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
            {matchedList.map((sk,j) => <span key={j} style={{ padding:"4px 11px", borderRadius:"20px", fontSize:"12px", fontWeight:"600", background:"#dcfce7", color:"#15803d" }}>✓ {sk}</span>)}
            {missingList.map((sk,j) => <span key={j} style={{ padding:"4px 11px", borderRadius:"20px", fontSize:"12px", fontWeight:"600", background:"#fee2e2", color:"#b91c1c" }}>✗ {sk}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   PDF REPORT
════════════════════════════════════════ */
function PlacementReport({ profile, matches }) {
  const [reportData, setReportData] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch(`${API}/my-report`, {
      headers: { Authorization: localStorage.getItem("token") || "" },
    })
      .then(r => r.json())
      .then(data => { setReportData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const downloadPDF = () => {
    const rd = reportData;
    if (!rd) return;

    const skillList = (rd.profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);
    const certList  = (rd.profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean);

    const cgpaColor = rd.profile.cgpa >= 7.5 ? "#15803d" : rd.profile.cgpa >= 6 ? "#92400e" : "#b91c1c";
    const cgpaLabel = rd.profile.cgpa >= 7.5 ? "Excellent" : rd.profile.cgpa >= 6 ? "Good" : "Average";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Placement Report — ${rd.profile.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; background: #fff; }

  /* Header */
  .header { background: linear-gradient(135deg, #0f172a, #1e3a5f); border-radius: 14px; padding: 28px 32px; color: #fff; margin-bottom: 24px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
  .badge { font-size: 11px; color: #6EE7B7; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
  .header h1 { font-size: 26px; font-weight: 900; letter-spacing: -0.03em; }
  .header .role { font-size: 14px; color: #93C5FD; margin-top: 4px; }
  .header .sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 6px; }
  .stats { display: flex; gap: 24px; text-align: center; }
  .stat-val { font-size: 28px; font-weight: 900; letter-spacing: -0.04em; }
  .stat-lbl { font-size: 10px; color: rgba(255,255,255,0.45); font-weight: 600; text-transform: uppercase; margin-top: 2px; }

  /* Sections */
  .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .section h3 { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* Info cells */
  .info-cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
  .info-cell .lbl { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .info-cell .val { font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px; }

  /* Chips */
  .chip { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 3px; }
  .chip-blue  { background: #EFF6FF; color: #1D4ED8; }
  .chip-green { background: #dcfce7; color: #15803d; }
  .chip-red   { background: #fee2e2; color: #b91c1c; }

  /* CGPA bar */
  .bar-track { background: #f1f5f9; height: 8px; border-radius: 8px; overflow: hidden; margin-top: 8px; }
  .bar-fill  { height: 100%; border-radius: 8px; }

  /* Match rows */
  .match-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px; }
  .badge-pill { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 700; }

  /* Gap rows */
  .gap-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .gap-name { min-width: 120px; font-size: 13px; font-weight: 700; text-transform: capitalize; }

  /* Footer */
  .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }

  @media print {
    body { background: #fff; }
    .page { padding: 20px; max-width: 100%; box-shadow: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="badge">PlaceIQ · Placement Report</div>
        <h1>${rd.profile.name}</h1>
        <div class="role">${rd.profile.preferred_role || "Student"}</div>
        <div class="sub">${rd.profile.email} · ${rd.profile.education || "Education not specified"}</div>
      </div>
      <div class="stats">
        <div><div class="stat-val" style="color:#6EE7B7">${rd.analytics.total_matches}</div><div class="stat-lbl">Matches</div></div>
        <div><div class="stat-val" style="color:#93C5FD">${rd.analytics.eligible_jobs}</div><div class="stat-lbl">Eligible</div></div>
        <div><div class="stat-val" style="color:#FCD34D">${rd.analytics.avg_match_score}%</div><div class="stat-lbl">Avg Score</div></div>
      </div>
    </div>
  </div>

  <!-- Academic Info -->
  <div class="section">
    <h3>🎓 Academic Profile</h3>
    <div class="grid2">
      <div class="info-cell"><div class="lbl">Education</div><div class="val">${rd.profile.education || "Not specified"}</div></div>
      <div class="info-cell"><div class="lbl">Experience</div><div class="val">${rd.profile.experience || "Not specified"}</div></div>
      <div class="info-cell"><div class="lbl">Preferred Role</div><div class="val">${rd.profile.preferred_role || "Not specified"}</div></div>
      <div class="info-cell">
        <div class="lbl">CGPA</div>
        ${rd.profile.cgpa != null
          ? `<div class="val" style="color:${cgpaColor};font-size:20px;font-weight:900">${rd.profile.cgpa} <span style="font-size:13px;color:#94a3b8;font-weight:600">/ 10</span></div>
             <div class="bar-track"><div class="bar-fill" style="width:${(rd.profile.cgpa/10)*100}%;background:${cgpaColor}"></div></div>
             <div style="font-size:11px;color:#64748b;margin-top:4px">${cgpaLabel}</div>`
          : `<div class="val" style="color:#94a3b8;font-style:italic">Not provided</div>`}
      </div>
    </div>
  </div>

  <!-- Skills -->
  <div class="section">
    <h3>🧠 Skills</h3>
    ${skillList.length > 0
      ? skillList.map(sk => `<span class="chip chip-blue">${sk}</span>`).join("")
      : "<p style='color:#94a3b8;font-size:13px'>No skills listed.</p>"}
  </div>

  <!-- Certifications -->
  <div class="section">
    <h3>🏅 Certifications</h3>
    ${certList.length > 0
      ? certList.map(c => `<span class="chip chip-green">${c}</span>`).join("")
      : "<p style='color:#94a3b8;font-size:13px'>No certifications listed.</p>"}
  </div>

  <!-- Projects -->
  ${rd.profile.projects ? `
  <div class="section">
    <h3>🛠 Projects</h3>
    <p style="font-size:14px;color:#475569;line-height:1.7;white-space:pre-line">${rd.profile.projects}</p>
  </div>` : ""}

  <!-- Skill Gaps -->
  ${rd.analytics.top_skill_gaps && rd.analytics.top_skill_gaps.length > 0 ? `
  <div class="section">
    <h3>🔍 Top Skill Gaps</h3>
    ${rd.analytics.top_skill_gaps.map((g, i) => `
      <div class="gap-row">
        <span class="gap-name">${g.skill}</span>
        <div style="flex:1;background:#f1f5f9;height:6px;border-radius:6px;overflow:hidden">
          <div style="width:${Math.min(100,(g.count/(rd.analytics.total_matches||1))*100)}%;height:100%;background:${i===0?"#EF4444":i<=2?"#F59E0B":"#94a3b8"};border-radius:6px"></div>
        </div>
        <span style="font-size:12px;color:#64748b;min-width:60px;text-align:right">${g.count} jobs</span>
      </div>`).join("")}
  </div>` : ""}

  <!-- Top Job Matches -->
  ${rd.top_matches && rd.top_matches.length > 0 ? `
  <div class="section">
    <h3>🎯 Top Job Matches</h3>
    ${rd.top_matches.map(m => {
      const bg  = m.overall_match_pct >= 80 ? "#dcfce7" : m.overall_match_pct >= 60 ? "#dbeafe" : m.overall_match_pct >= 40 ? "#fef3c7" : "#fee2e2";
      const clr = m.overall_match_pct >= 80 ? "#15803d" : m.overall_match_pct >= 60 ? "#1d4ed8" : m.overall_match_pct >= 40 ? "#92400e" : "#b91c1c";
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

  <div class="footer">
    Generated by PlaceIQ · ${new Date(rd.generated_at).toLocaleString("en-IN")}
  </div>
</div>
</body>
</html>`;

    /* Open in new tab and trigger browser print dialog → Save as PDF */
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 600);
  };

  if (loading) return (
    <div style={{ textAlign:"center", padding:"60px", color:"#94a3b8" }}>
      <p style={{ fontSize:"28px", marginBottom:"10px" }}>📋</p>
      Generating your placement report…
    </div>
  );

  if (!reportData) return (
    <div style={{ textAlign:"center", padding:"60px", color:"#94a3b8" }}>
      Failed to load report data.
    </div>
  );

  const rd        = reportData;
  const skillList = (rd.profile.skills         || "").split(",").map(s => s.trim()).filter(Boolean);
  const certList  = (rd.profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean);
  const cgpaColor = rd.profile.cgpa >= 7.5 ? "#15803d" : rd.profile.cgpa >= 6 ? "#92400e" : "#b91c1c";

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h3 style={{ margin:0, fontSize:"16px", fontWeight:"800", color:"#0f172a" }}>📋 Placement Report</h3>
          <p style={{ margin:"3px 0 0", fontSize:"12px", color:"#64748b" }}>
            Generated · {new Date(rd.generated_at).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" })}
          </p>
        </div>
        <button onClick={downloadPDF} style={{
          padding:"10px 22px",
          background:"linear-gradient(135deg,#0f172a,#1e293b)",
          color:"#6EE7B7", border:"none", borderRadius:"10px",
          fontSize:"13px", fontWeight:"700", cursor:"pointer",
          display:"flex", alignItems:"center", gap:"8px",
        }}>
          ⬇ Download PDF
        </button>
      </div>

      {/* ── Report Preview ── */}

      {/* Header banner */}
      <div style={{
        background:"linear-gradient(135deg,#0f172a,#1e3a5f)",
        borderRadius:"16px", padding:"26px 28px",
        display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"16px",
        marginBottom:"16px",
      }}>
        <div>
          <p style={{ margin:0, fontSize:"11px", color:"#6EE7B7", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em" }}>
            PlaceIQ · Placement Report
          </p>
          <h2 style={{ margin:"6px 0 4px", fontSize:"24px", fontWeight:"900", color:"#fff", letterSpacing:"-0.03em" }}>
            {rd.profile.name}
          </h2>
          <p style={{ margin:0, fontSize:"14px", color:"#93C5FD" }}>{rd.profile.preferred_role}</p>
          <p style={{ margin:"6px 0 0", fontSize:"12px", color:"rgba(255,255,255,0.4)" }}>
            {rd.profile.email} · {rd.profile.education}
          </p>
        </div>
        <div style={{ display:"flex", gap:"24px", alignItems:"center" }}>
          {[
            { label:"Matches",   value:rd.analytics.total_matches,  color:"#6EE7B7" },
            { label:"Eligible",  value:rd.analytics.eligible_jobs,  color:"#93C5FD" },
            { label:"Avg Score", value:`${rd.analytics.avg_match_score}%`, color:"#FCD34D" },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:"center" }}>
              <p style={{ margin:0, fontSize:"26px", fontWeight:"900", color:s.color, letterSpacing:"-0.04em" }}>{s.value}</p>
              <p style={{ margin:"2px 0 0", fontSize:"10px", color:"rgba(255,255,255,0.4)", fontWeight:"600", textTransform:"uppercase" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>

        {/* CGPA */}
        <ReportCard title="📊 CGPA">
          {rd.profile.cgpa != null ? (
            <>
              <p style={{ margin:"0 0 8px", fontSize:"32px", fontWeight:"900", color:cgpaColor, letterSpacing:"-0.04em" }}>
                {rd.profile.cgpa}<span style={{ fontSize:"14px", color:"#94a3b8", fontWeight:"600" }}> / 10</span>
              </p>
              <div style={{ background:"#f1f5f9", height:"8px", borderRadius:"8px", overflow:"hidden" }}>
                <div style={{ width:`${(rd.profile.cgpa/10)*100}%`, height:"100%", background:cgpaColor, borderRadius:"8px" }} />
              </div>
              <p style={{ margin:"6px 0 0", fontSize:"12px", color:"#64748b" }}>
                {rd.profile.cgpa >= 7.5 ? "Excellent — above average" : rd.profile.cgpa >= 6 ? "Good — scope for improvement" : "Needs improvement"}
              </p>
            </>
          ) : <p style={{ margin:0, fontSize:"13px", color:"#94a3b8" }}>CGPA not provided.</p>}
        </ReportCard>

        {/* Certifications */}
        <ReportCard title="🏅 Certifications">
          {certList.length > 0 ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {certList.map((c,i) => (
                <span key={i} style={{ padding:"4px 12px", borderRadius:"20px", background:"#F0FDF4", color:"#15803d", fontSize:"12px", fontWeight:"600" }}>{c}</span>
              ))}
            </div>
          ) : <p style={{ margin:0, fontSize:"13px", color:"#94a3b8" }}>No certifications listed.</p>}
        </ReportCard>
      </div>

      {/* Skills */}
      <ReportCard title="🧠 Skills" mb="14px">
        {skillList.length > 0 ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
            {skillList.map((sk,i) => (
              <span key={i} style={{ padding:"5px 13px", borderRadius:"20px", background:"#EFF6FF", color:"#1D4ED8", fontSize:"13px", fontWeight:"600" }}>{sk}</span>
            ))}
          </div>
        ) : <p style={{ margin:0, fontSize:"13px", color:"#94a3b8" }}>No skills listed.</p>}
      </ReportCard>

      {/* Projects */}
      {rd.profile.projects && (
        <ReportCard title="🛠 Projects" mb="14px">
          <p style={{ margin:0, fontSize:"14px", color:"#475569", lineHeight:"1.7", whiteSpace:"pre-line" }}>
            {rd.profile.projects}
          </p>
        </ReportCard>
      )}

      {/* Skill Gaps */}
      {rd.analytics.top_skill_gaps && rd.analytics.top_skill_gaps.length > 0 && (
        <ReportCard title="🔍 Top Skill Gaps" mb="14px">
          {rd.analytics.top_skill_gaps.map((g,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"8px" }}>
              <span style={{ minWidth:"120px", fontSize:"13px", fontWeight:"700", color:"#0f172a", textTransform:"capitalize" }}>{g.skill}</span>
              <div style={{ flex:1, background:"#f1f5f9", height:"6px", borderRadius:"6px", overflow:"hidden" }}>
                <div style={{
                  width:`${Math.min(100,(g.count/(rd.analytics.total_matches||1))*100)}%`,
                  height:"100%", borderRadius:"6px",
                  background:i===0?"#EF4444":i<=2?"#F59E0B":"#94a3b8",
                }} />
              </div>
              <span style={{ fontSize:"12px", color:"#64748b", minWidth:"60px", textAlign:"right" }}>{g.count} jobs</span>
            </div>
          ))}
        </ReportCard>
      )}

      {/* Top Job Matches */}
      {rd.top_matches && rd.top_matches.length > 0 && (
        <ReportCard title="🎯 Top Job Matches">
          {rd.top_matches.map((m,i) => {
            const sc = scoreColor(m.overall_match_pct || 0);
            return (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"12px 14px", background:"#f8fafc",
                borderRadius:"10px", border:"1px solid #e2e8f0",
                marginBottom:"8px", flexWrap:"wrap", gap:"8px",
              }}>
                <div>
                  <p style={{ margin:0, fontSize:"14px", fontWeight:"700", color:"#0f172a" }}>{m.job_title}</p>
                  <p style={{ margin:"2px 0 0", fontSize:"12px", color:"#64748b" }}>
                    {m.company_name} · {m.location}{m.salary && m.salary !== "N/A" ? ` · ${m.salary} LPA` : ""}
                  </p>
                </div>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  <span style={{ fontSize:"13px", fontWeight:"800", color:sc.text }}>{m.overall_match_pct}%</span>
                  <span style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px", background:sc.bg, color:sc.text, fontWeight:"700" }}>
                    {m.eligible === "Yes" ? "✓ Eligible" : "⚠ Needs Skills"}
                  </span>
                </div>
              </div>
            );
          })}
        </ReportCard>
      )}
    </div>
  );
}

function ReportCard({ title, children, mb = "0" }) {
  return (
    <div style={{
      background:"#fff", borderRadius:"14px",
      padding:"20px", border:"1px solid #e2e8f0", marginBottom:mb,
    }}>
      <h3 style={{ margin:"0 0 14px", fontSize:"13px", fontWeight:"800", color:"#0f172a", textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {title}
      </h3>
      {children}
    </div>
  );
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
      fetch(`${API}/my-profile`,           { headers }).then(r => r.json()),
      fetch(`${API}/my-dashboard-matches`, { headers }).then(r => r.json()),
    ])
      .then(([profileData, matchData]) => {
        if (!profileData.error) {
          setProfile(profileData);
          setEditForm({
            name:           profileData.name           || "",
            skills:         profileData.skills         || "",
            education:      profileData.education      || "",
            experience:     profileData.experience     || "",
            preferred_role: profileData.preferred_role || "",
            certifications: profileData.certifications || "",
            projects:       profileData.projects       || "",
            cgpa:           profileData.cgpa           != null ? profileData.cgpa : "",
          });
        }
        setMatches(Array.isArray(matchData) ? matchData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const saveProfile = async () => {
    if (editForm.cgpa !== "" && (isNaN(Number(editForm.cgpa)) || Number(editForm.cgpa) < 0 || Number(editForm.cgpa) > 10)) {
      setSaveMsg("⚠ CGPA must be between 0 and 10."); return;
    }
    setSaving(true); setSaveMsg("");
    try {
      const res  = await fetch(`${API}/update-profile`, {
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
      setSaveMsg("⚠ Server error.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  };

  const eligible    = matches.filter(m => m.eligible === "Yes");
  const needsSkills = matches.filter(m => m.eligible !== "Yes");
  const skillList   = (profile.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const avgScore    = matches.length
    ? Math.round(matches.reduce((s, m) => s + (m.overall_match_pct || 0), 0) / matches.length) : 0;

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
        background:"linear-gradient(135deg,#0f172a,#1e3a5f)",
        borderRadius:"18px", padding:"24px 28px",
        display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:"24px", flexWrap:"wrap", gap:"16px",
      }}>
        <div>
          <p style={{ margin:0, fontSize:"12px", color:"#6EE7B7", fontWeight:"700", letterSpacing:"0.08em", textTransform:"uppercase" }}>
            Student Portal
          </p>
          <h2 style={{ margin:"6px 0 4px", fontSize:"22px", fontWeight:"800", color:"#fff", letterSpacing:"-0.03em" }}>
            Welcome back, {profile.name || "Student"} 👋
          </h2>
          <p style={{ margin:0, fontSize:"13px", color:"rgba(255,255,255,0.5)" }}>
            {profile.preferred_role ? `Showing ${profile.preferred_role} jobs` : "Set your preferred role for personalised matches"}
          </p>
        </div>
        <div style={{ display:"flex", gap:"22px" }}>
          {[
            { label:"Matches",   value:matches.length,   color:"#6EE7B7" },
            { label:"Eligible",  value:eligible.length,  color:"#93C5FD" },
            { label:"Avg Score", value:`${avgScore}%`,   color:"#FCD34D" },
            { label:"Readiness", value:`${readiness}%`,  color:"#F9A8D4" },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:"center" }}>
              <p style={{ margin:0, fontSize:"22px", fontWeight:"800", color:s.color, letterSpacing:"-0.04em" }}>{s.value}</p>
              <p style={{ margin:"2px 0 0", fontSize:"10px", color:"rgba(255,255,255,0.4)", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.04em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"20px", flexWrap:"wrap" }}>
        {[
          { key:"matches",  label:"🎯 Job Matches" },
          { key:"profile",  label:"🎓 My Profile" },
          { key:"skillgap", label:"🧠 Skill Gap" },
          { key:"resume",   label:"📄 Resume" },
          { key:"report",   label:"📋 Report" },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:"8px 18px", borderRadius:"10px", fontSize:"13px",
            fontWeight:"600", cursor:"pointer", border:"none",
            background: activeTab === t.key ? "#0f172a" : "#f1f5f9",
            color:      activeTab === t.key ? "#fff"    : "#64748b",
            transition:"all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ JOB MATCHES ══ */}
      {activeTab === "matches" && (
        loading ? (
          <div style={{ textAlign:"center", padding:"60px", color:"#94a3b8" }}>Loading matches…</div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px", background:"#fff", borderRadius:"16px", border:"1px solid #e2e8f0" }}>
            <p style={{ fontSize:"32px", margin:"0 0 10px" }}>🔍</p>
            <p style={{ margin:0, fontWeight:"700", color:"#0f172a" }}>No preferred-role jobs found</p>
            <p style={{ margin:"6px 0 0", fontSize:"13px", color:"#94a3b8" }}>Set your <strong>Preferred Role</strong> in the Profile tab.</p>
          </div>
        ) : (
          <div>
            {eligible.length > 0 && (
              <div style={{ marginBottom:"28px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
                  <span style={{ width:10, height:10, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
                  <h3 style={{ margin:0, fontSize:"14px", fontWeight:"800", color:"#0f172a", textTransform:"uppercase", letterSpacing:"0.05em" }}>Eligible Jobs</h3>
                  <span style={{ fontSize:"12px", padding:"2px 10px", borderRadius:"20px", background:"#dcfce7", color:"#15803d", fontWeight:"700" }}>{eligible.length}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {eligible.map((item,i) => <JobCard key={item._id||i} item={item} />)}
                </div>
              </div>
            )}
            {needsSkills.length > 0 && (
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
                  <span style={{ width:10, height:10, borderRadius:"50%", background:"#F59E0B", display:"inline-block" }} />
                  <h3 style={{ margin:0, fontSize:"14px", fontWeight:"800", color:"#0f172a", textTransform:"uppercase", letterSpacing:"0.05em" }}>Needs More Skills</h3>
                  <span style={{ fontSize:"12px", padding:"2px 10px", borderRadius:"20px", background:"#fef3c7", color:"#92400e", fontWeight:"700" }}>{needsSkills.length}</span>
                </div>
                {topGaps.length > 0 && (
                  <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:"12px", padding:"14px 18px", marginBottom:"12px", display:"flex", gap:"14px", alignItems:"center", flexWrap:"wrap" }}>
                    <p style={{ margin:0, fontSize:"13px", color:"#6EE7B7", fontWeight:"700", flexShrink:0 }}>💡 Learn to unlock more jobs:</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                      {topGaps.slice(0,5).map(([sk,cnt],i) => (
                        <span key={i} style={{ padding:"3px 11px", borderRadius:"20px", background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:"12px", fontWeight:"600", textTransform:"capitalize" }}>
                          {sk} <span style={{ color:"#FCD34D" }}>×{cnt}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {needsSkills.map((item,i) => <JobCard key={item._id||i} item={item} />)}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ══ MY PROFILE ══ */}
      {activeTab === "profile" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {saveMsg && (
            <div style={{
              padding:"12px 16px", borderRadius:"10px", fontSize:"13px", fontWeight:"600",
              background:saveMsg.startsWith("✓") ? "#dcfce7" : "#FEF2F2",
              color:     saveMsg.startsWith("✓") ? "#15803d"  : "#DC2626",
              border:    saveMsg.startsWith("✓") ? "1px solid #86efac" : "1px solid #FECACA",
            }}>{saveMsg}</div>
          )}

          <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", border:"1px solid #e2e8f0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{
                  width:"56px", height:"56px", borderRadius:"50%",
                  background:"linear-gradient(135deg,#3B82F6,#6EE7B7)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"22px", fontWeight:"800", color:"#0f172a", flexShrink:0,
                }}>
                  {(profile.name || "S")[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin:0, fontSize:"17px", fontWeight:"800", color:"#0f172a" }}>{profile.name}</h3>
                  <p style={{ margin:"2px 0 0", fontSize:"13px", color:"#3B82F6", fontWeight:"600" }}>
                    {profile.preferred_role || "No preferred role set"}
                  </p>
                </div>
              </div>
              <button onClick={() => { setEditing(e => !e); setSaveMsg(""); }} style={{
                padding:"8px 18px", borderRadius:"10px", fontSize:"13px",
                fontWeight:"700", cursor:"pointer", border:"none",
                background:editing ? "#f1f5f9" : "#0f172a",
                color:     editing ? "#64748b" : "#fff",
              }}>
                {editing ? "Cancel" : "✏️ Edit Profile"}
              </button>
            </div>

            {/* View mode */}
            {!editing ? (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:"12px", marginBottom:"12px" }}>
                  {[
                    { label:"Full Name",      value:profile.name,           icon:"👤" },
                    { label:"Email",          value:profile.email,          icon:"📧" },
                    { label:"Education",      value:profile.education,      icon:"🎓" },
                    { label:"Experience",     value:profile.experience,     icon:"💼" },
                    { label:"Preferred Role", value:profile.preferred_role, icon:"🎯" },
                    { label:"CGPA",           value:profile.cgpa != null ? `${profile.cgpa} / 10` : null, icon:"📊" },
                  ].map((f,i) => (
                    <div key={i} style={{ padding:"14px 16px", background:"#f8fafc", borderRadius:"12px", border:"1px solid #e2e8f0" }}>
                      <p style={{ margin:0, fontSize:"11px", color:"#94a3b8", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.06em" }}>{f.icon} {f.label}</p>
                      <p style={{ margin:"5px 0 0", fontSize:"14px", fontWeight:"600", color: f.label === "Preferred Role" ? "#2563eb" : "#0f172a" }}>
                        {f.value || <span style={{ color:"#cbd5e1", fontStyle:"italic" }}>Not set</span>}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Certifications */}
                <div style={{ padding:"14px 16px", background:"#f8fafc", borderRadius:"12px", border:"1px solid #e2e8f0", marginBottom:"10px" }}>
                  <p style={{ margin:"0 0 8px", fontSize:"11px", color:"#94a3b8", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.06em" }}>🏅 Certifications</p>
                  {(profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean).length > 0 ? (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                      {(profile.certifications || "").split(",").map(s => s.trim()).filter(Boolean).map((c,i) => (
                        <span key={i} style={{ padding:"3px 10px", borderRadius:"20px", background:"#F0FDF4", color:"#15803d", fontSize:"12px", fontWeight:"600" }}>{c}</span>
                      ))}
                    </div>
                  ) : <span style={{ fontSize:"13px", color:"#cbd5e1", fontStyle:"italic" }}>Not set</span>}
                </div>
                {/* Projects */}
                {profile.projects && (
                  <div style={{ padding:"14px 16px", background:"#f8fafc", borderRadius:"12px", border:"1px solid #e2e8f0" }}>
                    <p style={{ margin:"0 0 6px", fontSize:"11px", color:"#94a3b8", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.06em" }}>🛠 Projects</p>
                    <p style={{ margin:0, fontSize:"14px", color:"#0f172a", lineHeight:"1.6", whiteSpace:"pre-line" }}>{profile.projects}</p>
                  </div>
                )}
              </>
            ) : (
              /* Edit mode */
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                <FF label="Full Name" icon="👤">
                  <input style={iSt} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name:e.target.value }))} placeholder="Your full name" />
                </FF>
                <FF label="Education" icon="🎓">
                  <input style={iSt} value={editForm.education} onChange={e => setEditForm(f => ({ ...f, education:e.target.value }))} placeholder="e.g. B.Tech CSE, 2025" />
                </FF>
                <FF label="Experience" icon="💼">
                  <input style={iSt} value={editForm.experience} onChange={e => setEditForm(f => ({ ...f, experience:e.target.value }))} placeholder="Fresher / 1 year internship" />
                </FF>
                <FF label="Preferred Role" icon="🎯">
                  <select style={{ ...iSt, cursor:"pointer" }} value={editForm.preferred_role} onChange={e => setEditForm(f => ({ ...f, preferred_role:e.target.value }))}>
                    <option value="">— Select a role —</option>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </FF>
                <FF label="CGPA (0–10)" icon="📊">
                  <input style={iSt} type="number" min="0" max="10" step="0.01"
                    value={editForm.cgpa} placeholder="e.g. 8.5"
                    onChange={e => setEditForm(f => ({ ...f, cgpa:e.target.value }))} />
                </FF>
                <FF label="Skills (comma-separated)" icon="🧠" full>
                  <input style={iSt} value={editForm.skills} onChange={e => setEditForm(f => ({ ...f, skills:e.target.value }))} placeholder="Python, React, SQL…" />
                  {editForm.skills && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", marginTop:"8px" }}>
                      {editForm.skills.split(",").map(s => s.trim()).filter(Boolean).map((sk,i) => (
                        <span key={i} style={{ padding:"3px 10px", borderRadius:"20px", background:"#EFF6FF", color:"#1D4ED8", fontSize:"12px", fontWeight:"600" }}>{sk}</span>
                      ))}
                    </div>
                  )}
                </FF>
                <FF label="Certifications (comma-separated)" icon="🏅" full>
                  <input style={iSt} value={editForm.certifications} onChange={e => setEditForm(f => ({ ...f, certifications:e.target.value }))} placeholder="AWS Cloud Practitioner, Google Analytics…" />
                </FF>
                <FF label="Projects" icon="🛠" full>
                  <textarea style={{ ...iSt, minHeight:"80px", resize:"vertical", lineHeight:"1.6" }} value={editForm.projects} onChange={e => setEditForm(f => ({ ...f, projects:e.target.value }))} placeholder="Describe your key projects…" />
                </FF>
                <div style={{ gridColumn:"1 / -1", display:"flex", gap:"10px", marginTop:"4px" }}>
                  <button onClick={saveProfile} disabled={saving} style={{
                    padding:"11px 28px",
                    background:saving ? "#94a3b8" : "linear-gradient(135deg,#3B82F6,#2563eb)",
                    color:"#fff", border:"none", borderRadius:"10px",
                    fontSize:"14px", fontWeight:"700",
                    cursor:saving ? "not-allowed" : "pointer",
                  }}>
                    {saving ? "Saving…" : "Save Changes ✓"}
                  </button>
                  <button onClick={() => setEditing(false)} style={{
                    padding:"11px 20px", background:"#f1f5f9", color:"#475569",
                    border:"none", borderRadius:"10px", fontSize:"14px", fontWeight:"600", cursor:"pointer",
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SKILL GAP ══ */}
      {activeTab === "skillgap" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {/* Readiness bar */}
          <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius:"16px", padding:"24px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"10px" }}>
              <div>
                <p style={{ margin:0, fontSize:"12px", color:"#6EE7B7", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.08em" }}>Overall Skill Readiness</p>
                <p style={{ margin:"4px 0 0", fontSize:"13px", color:"rgba(255,255,255,0.5)" }}>Based on {matches.length} {profile.preferred_role || "preferred role"} jobs</p>
              </div>
              <p style={{ margin:0, fontSize:"42px", fontWeight:"900", letterSpacing:"-0.05em", color:readiness>=60?"#6EE7B7":readiness>=40?"#FCD34D":"#FCA5A5" }}>{readiness}%</p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", height:"10px", borderRadius:"10px", overflow:"hidden" }}>
              <div style={{ width:`${readiness}%`, height:"100%", background:readiness>=60?"#6EE7B7":readiness>=40?"#FCD34D":"#FCA5A5", borderRadius:"10px", transition:"width 0.6s ease" }} />
            </div>
            <p style={{ margin:"8px 0 0", fontSize:"12px", color:"rgba(255,255,255,0.4)" }}>
              You have {owned.length} of {allRequired.length} unique skills required
            </p>
          </div>

          {/* Have vs Need columns */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
            <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", border:"1px solid #e2e8f0" }}>
              <h3 style={{ margin:"0 0 14px", fontSize:"14px", fontWeight:"800", color:"#15803d" }}>✅ Skills You Have ({owned.length})</h3>
              {owned.length > 0 ? (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"7px" }}>
                  {owned.map((sk,i) => <span key={i} style={{ padding:"5px 12px", borderRadius:"20px", fontSize:"13px", fontWeight:"600", background:"#dcfce7", color:"#15803d", border:"1px solid #86efac" }}>✓ {sk}</span>)}
                </div>
              ) : <p style={{ margin:0, fontSize:"13px", color:"#94a3b8" }}>No matching skills yet.</p>}
            </div>
            <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", border:"1px solid #e2e8f0" }}>
              <h3 style={{ margin:"0 0 14px", fontSize:"14px", fontWeight:"800", color:"#b91c1c" }}>❌ Skills to Learn ({notOwned.length})</h3>
              {notOwned.length > 0 ? (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"7px" }}>
                  {notOwned.map((sk,i) => <span key={i} style={{ padding:"5px 12px", borderRadius:"20px", fontSize:"13px", fontWeight:"600", background:"#fee2e2", color:"#b91c1c", border:"1px solid #fca5a5" }}>✗ {sk}</span>)}
                </div>
              ) : <p style={{ margin:0, fontSize:"13px", color:"#15803d", fontWeight:"600" }}>🎉 You have all skills!</p>}
            </div>
          </div>

          {/* Gap priority */}
          {topGaps.length > 0 && (
            <div style={{ background:"#fff", borderRadius:"16px", padding:"22px", border:"1px solid #e2e8f0" }}>
              <h3 style={{ margin:"0 0 6px", fontSize:"15px", fontWeight:"700", color:"#0f172a" }}>📊 Skill Gap Priority</h3>
              <p style={{ margin:"0 0 18px", fontSize:"13px", color:"#64748b" }}>Skills missing most frequently — learn these first</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {topGaps.map(([sk,cnt],i) => {
                  const pct = Math.round((cnt/matches.length)*100);
                  const priority = i===0 ? { bg:"#fef2f2", badge:"#fee2e2", badgeText:"#b91c1c", label:"🔥 High Priority" }
                                 : i<=2  ? { bg:"#fffbeb", badge:"#fef3c7", badgeText:"#92400e", label:"⚡ Medium" }
                                 :         { bg:"#f8fafc", badge:"#f1f5f9", badgeText:"#475569", label:"📌 Learn" };
                  return (
                    <div key={i} style={{ background:priority.bg, borderRadius:"12px", padding:"14px 16px", border:"1px solid #e2e8f0" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                          <span style={{ fontSize:"15px", fontWeight:"700", color:"#0f172a", textTransform:"capitalize" }}>{sk}</span>
                          <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"20px", background:priority.badge, color:priority.badgeText, fontWeight:"700" }}>{priority.label}</span>
                        </div>
                        <span style={{ fontSize:"13px", fontWeight:"800", color:"#0f172a" }}>{cnt}/{matches.length} jobs</span>
                      </div>
                      <div style={{ background:"rgba(0,0,0,0.06)", height:"6px", borderRadius:"6px", overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:i===0?"#EF4444":i<=2?"#F59E0B":"#94a3b8", borderRadius:"6px" }} />
                      </div>
                      <p style={{ margin:"5px 0 0", fontSize:"11px", color:"#64748b" }}>Missing in {pct}% of your matched jobs</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ background:"linear-gradient(135deg,#1e293b,#0f172a)", borderRadius:"14px", padding:"18px 22px", display:"flex", gap:"14px", alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:1 }}>
              <p style={{ margin:"0 0 4px", fontSize:"13px", fontWeight:"700", color:"#6EE7B7" }}>🚀 Next Steps</p>
              <p style={{ margin:0, fontSize:"13px", color:"rgba(255,255,255,0.6)", lineHeight:"1.6" }}>
                Once you learn a new skill, go to <strong style={{ color:"#fff" }}>Edit Profile</strong> → update your Skills → matches regenerate automatically.
              </p>
            </div>
            <button onClick={() => setActiveTab("profile")} style={{ padding:"10px 18px", background:"#6EE7B7", color:"#0f172a", border:"none", borderRadius:"10px", fontSize:"13px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap" }}>
              Update Skills →
            </button>
          </div>
        </div>
      )}

      {/* ══ RESUME ══ */}
      {activeTab === "resume" && (
        <div style={{ background:"#fff", borderRadius:"16px", padding:"28px", border:"1px solid #e2e8f0", maxWidth:"480px" }}>
          <h3 style={{ margin:"0 0 6px", fontSize:"15px", fontWeight:"700", color:"#0f172a" }}>📄 Upload Your Resume</h3>
          <p style={{ margin:"0 0 20px", fontSize:"13px", color:"#64748b" }}>Upload a PDF resume to complete your placement profile. Max 5 MB.</p>
          <ResumeUpload userId={profile.user_id} />
        </div>
      )}

      {/* ══ REPORT ══ */}
      {activeTab === "report" && (
        <PlacementReport profile={profile} matches={matches} />
      )}
    </div>
  );
}

/* ── Helpers ── */
function FF({ label, icon, children, full }) {
  return (
    <div style={{ gridColumn:full ? "1 / -1" : "auto" }}>
      <label style={{ display:"block", fontSize:"11px", fontWeight:"700", color:"#374151", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );
}

const iSt = {
  width:"100%", padding:"10px 13px", boxSizing:"border-box",
  border:"1.5px solid #e2e8f0", borderRadius:"10px",
  fontSize:"14px", color:"#0f172a", outline:"none", background:"#f8fafc",
};
