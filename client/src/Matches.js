import React, { useEffect, useState } from "react";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");

    /* ── Use /my-matches (authenticated) so we only get THIS student's
          matches with correct salary, openings and skill data.
          The public /matches endpoint returns ALL users mixed together
          and has no per-student filtering. ── */
    fetch("http://localhost:5000/my-matches", {
      headers: { Authorization: token || "" },
    })
      .then(res => res.json())
      .then(data => {
        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ── Filter ── */
  const displayed = matches.filter(m => {
    if (filter === "eligible") return m.eligible === "Yes";
    if (filter === "high")     return (m.overall_match_pct || 0) >= 70;
    return true;
  });

  /* ── Score color ── */
  const scoreColor = (pct) => {
    if (pct >= 80) return { bar: "#22c55e", text: "#15803d", bg: "#dcfce7" };
    if (pct >= 60) return { bar: "#3B82F6", text: "#1d4ed8", bg: "#dbeafe" };
    if (pct >= 40) return { bar: "#F59E0B", text: "#92400e", bg: "#fef3c7" };
    return          { bar: "#EF4444", text: "#b91c1c", bg: "#fee2e2" };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>
          Job Matches
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
          AI-ranked opportunities based on your skills and preferred role
        </p>
      </div>

      {/* Not logged in warning */}
      {!localStorage.getItem("token") && (
        <div style={{
          background: "#FEF9C3", border: "1px solid #FDE047",
          borderRadius: "12px", padding: "14px 18px", marginBottom: "20px",
          fontSize: "13px", color: "#92400e", fontWeight: "600",
        }}>
          ⚠️ You are not logged in. Please{" "}
          <a href="/login" style={{ color: "#1d4ed8", textDecoration: "underline" }}>sign in</a>
          {" "}to see your personalised job matches.
        </div>
      )}

      {/* Summary bar */}
      {!loading && matches.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px", marginBottom: "20px",
        }}>
          {[
            { label: "Total Matches",    value: matches.length,                                        color: "#3B82F6" },
            { label: "Eligible Jobs",    value: matches.filter(m => m.eligible === "Yes").length,      color: "#22c55e" },
            { label: "High Score (70+)", value: matches.filter(m => (m.overall_match_pct||0) >= 70).length, color: "#F59E0B" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: "12px", padding: "14px 16px",
              border: "1px solid #e2e8f0", borderLeft: `4px solid ${s.color}`,
            }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.label}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "800", color: s.color, letterSpacing: "-0.04em" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { key: "all",      label: "All Matches" },
          { key: "eligible", label: "Eligible Only" },
          { key: "high",     label: "High Match (70+)" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            style={{
              padding: "7px 16px", borderRadius: "20px", fontSize: "13px",
              fontWeight: "600", cursor: "pointer", border: "none",
              background: filter === t.key ? "#3B82F6" : "#f1f5f9",
              color:      filter === t.key ? "#fff"    : "#64748b",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          Loading matches…
        </div>
      ) : displayed.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px",
          background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
        }}>
          <p style={{ fontSize: "32px", margin: "0 0 10px" }}>🔍</p>
          <p style={{ margin: 0, fontWeight: "700", color: "#0f172a" }}>No matches found</p>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#94a3b8" }}>
            {filter !== "all"
              ? "Try switching to 'All Matches' filter."
              : "Update your skills profile to generate matches."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {displayed.map((match, i) => {
            const pct  = match.overall_match_pct || 0;
            const sc   = scoreColor(pct);
            const matchedList = (match.matched_skills            || "").split(",").map(s => s.trim()).filter(Boolean);
            const missingList = (match.missing_mandatory_skills  || "").split(",").map(s => s.trim()).filter(Boolean);

            return (
              <div key={match._id || i} style={{
                background: "#fff", borderRadius: "16px",
                padding: "20px 22px", border: "1px solid #e2e8f0",
              }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                        {match.job_title || "Unknown Role"}
                      </h3>
                      <span style={{
                        fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                        background: "#EFF6FF", color: "#1D4ED8", fontWeight: "700",
                      }}>
                        #{match.recommendation_rank}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b" }}>
                      🏢 {match.company_name || "—"} &nbsp;·&nbsp; 📍 {match.location || "—"}
                    </p>
                  </div>

                  {/* Eligibility badge */}
                  <span style={{
                    padding: "5px 12px", borderRadius: "20px",
                    fontSize: "12px", fontWeight: "700",
                    background: sc.bg, color: sc.text, whiteSpace: "nowrap",
                  }}>
                    {match.eligible === "Yes" ? "✓ Eligible" : "⚠ Needs Skills"}
                  </span>
                </div>

                {/* Score bar */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Match Score</span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: sc.text }}>{pct}%</span>
                  </div>
                  <div style={{ background: "#f1f5f9", height: "8px", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: sc.bar, borderRadius: "8px",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>

                {/* Salary + openings */}
                <div style={{ display: "flex", gap: "18px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "#475569" }}>
                    💰 {match.salary && match.salary !== "N/A" ? `${match.salary} LPA` : "Salary not listed"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#475569" }}>
                    👥 {match.openings && match.openings !== "N/A" ? `${match.openings} openings` : "Openings not listed"}
                  </span>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "0 0 12px" }} />

                {/* Skill tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {matchedList.map((sk, j) => (
                    <span key={j} style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "12px",
                      fontWeight: "600", background: "#dcfce7", color: "#15803d",
                    }}>✓ {sk}</span>
                  ))}
                  {missingList.map((sk, j) => (
                    <span key={j} style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "12px",
                      fontWeight: "600", background: "#fee2e2", color: "#b91c1c",
                    }}>✗ {sk}</span>
                  ))}
                  {matchedList.length === 0 && missingList.length === 0 && (
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>No skill data available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}