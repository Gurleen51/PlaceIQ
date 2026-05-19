import React, { useEffect, useState } from "react";
import axios from "axios";
import {

  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  Legend, ResponsiveContainer, LabelList, CartesianGrid,
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const COLORS = ["#3B82F6", "#6EE7B7", "#F59E0B", "#EF4444"];

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "16px", padding: "22px 24px",
      border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px",
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "12px",
        background: color + "18", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: "22px",
      }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: "28px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.04em" }}>{value}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1e293b", color: "#fff", padding: "10px 14px",
        borderRadius: "10px", fontSize: "13px",
      }}>
        <p style={{ margin: 0, fontWeight: "700" }}>{label}</p>
        <p style={{ margin: "4px 0 0", color: "#94d2ff" }}>{payload[0].value} records</p>
      </div>
    );
  }
  return null;
};

function Dashboard() {
  const [stats,      setStats]      = useState({});
  const [skillsData, setSkillsData] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const isStudent = localStorage.getItem("role") === "student";
  const token     = localStorage.getItem("token");

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/dashboard-stats`),
      axios.get(`${API}/skills-data`),
    ])
      .then(([statsRes, skillsRes]) => {
        setStats(statsRes.data);
        setSkillsData(skillsRes.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ── Top 5 skills from DB ── */
  const topSkills = [...skillsData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  /* ── Student's own skills for gap analysis ── */
  const [myMatches, setMyMatches] = useState([]);
  useEffect(() => {
    if (!isStudent || !token) return;
    fetch(`${API}/my-dashboard-matches`, {
      headers: { Authorization: token },
    })
      .then(r => r.json())
      .then(data => setMyMatches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isStudent, token]);

  const gapFreq = {};
  myMatches.forEach(m =>
    (m.missing_mandatory_skills || "").split(",").map(s => s.trim()).filter(Boolean)
      .forEach(sk => { gapFreq[sk] = (gapFreq[sk] || 0) + 1; })
  );
  const topGaps = Object.entries(gapFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const barData = [
    { name: "Students",     value: stats.users        || 0 },
    { name: "Job Posts",    value: stats.jobs         || 0 },
    { name: "Applications", value: stats.applications || 0 },
    { name: "Skills",       value: stats.skills       || 0 },
  ];

  const pieData = [
    { name: "Applications", value: stats.applications || 0 },
    { name: "Unique Skills", value: stats.skills      || 0 },
  ];

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
      <div style={{ fontSize: "14px", color: "#94a3b8" }}>Loading data…</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>
          Platform Overview
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
          Real-time placement readiness metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <StatCard label="Registered Students" value={stats.users        || 0} color="#3B82F6" icon="👥" />
        <StatCard label="Job Postings"         value={stats.jobs         || 0} color="#22c55e" icon="💼" />
        <StatCard label="Applications"         value={stats.applications || 0} color="#F59E0B" icon="📄" />
        <StatCard label="Unique Skills"        value={stats.skills       || 0} color="#EF4444" icon="🧠" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Platform Statistics</h3>
          <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#94a3b8" }}>Aggregated data across all categories</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={44}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                <LabelList dataKey="value" position="top" style={{ fill: "#0f172a", fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Applications vs Skills</h3>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#94a3b8" }}>Breakdown by category</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="45%"
                outerRadius={90} innerRadius={40}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SKILL GAP SECTION ── */}
      {isStudent && myMatches.length > 0 && topGaps.length > 0 ? (
        /* Logged-in student — show their personal skill gaps */
        <div style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          borderRadius: "16px", padding: "24px", marginBottom: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#6EE7B7" }}>
                💡 Your Personal Skill Gaps
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                Based on your preferred-role job matches
              </p>
            </div>
            <a
              href="/student-dashboard"
              onClick={() => sessionStorage.setItem("dashTab", "profile")}
              style={{
                padding: "9px 18px", background: "#6EE7B7", color: "#0f172a",
                fontWeight: "700", fontSize: "13px", borderRadius: "10px",
                textDecoration: "none", whiteSpace: "nowrap",
              }}
            >
              View Full Profile →
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            {topGaps.map(([sk, cnt], i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.07)", borderRadius: "10px",
                padding: "12px 14px",
                borderLeft: "3px solid #6EE7B7",
              }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#fff", textTransform: "capitalize" }}>
                  {sk}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#FCD34D" }}>
                  Missing in {cnt} job{cnt > 1 ? "s" : ""}
                </p>
                <div style={{ marginTop: "8px", background: "rgba(255,255,255,0.1)", height: "4px", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.min(100, (cnt / myMatches.length) * 100)}%`,
                    height: "100%", background: "#6EE7B7", borderRadius: "4px",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Non-logged-in or no gaps — show generic placement tip + link to Skills page */
        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          borderRadius: "16px", padding: "22px 24px", marginBottom: "20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#6EE7B7" }}>
              💡 Placement Tip
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.7)", maxWidth: "560px" }}>
              Students with 4+ matched skills have 3× higher placement rates. Check the Skill Analytics page to see which skills are most in demand.
            </p>
          </div>
          <a href="/skills" style={{
            padding: "10px 18px", background: "#6EE7B7", color: "#0f172a",
            fontWeight: "700", fontSize: "13px", borderRadius: "10px",
            textDecoration: "none", whiteSpace: "nowrap",
          }}>
            View Skill Analytics →
          </a>
        </div>
      )}

      {/* ── TOP SKILLS IN DEMAND ── */}
      {topSkills.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                🔥 Top Skills Among Students
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                Most common skills across all registered students
              </p>
            </div>
            <a href="/skills" style={{
              fontSize: "13px", color: "#3B82F6", fontWeight: "600",
              textDecoration: "none",
            }}>
              View all →
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {topSkills.map((item, i) => {
              const pct = topSkills[0]?.count
                ? Math.round((item.count / topSkills[0].count) * 100) : 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontSize: "13px", fontWeight: "600", color: "#0f172a",
                    textTransform: "capitalize", minWidth: "110px",
                  }}>{item.skill}</span>
                  <div style={{ flex: 1, background: "#f1f5f9", height: "8px", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: COLORS[i % COLORS.length], borderRadius: "8px",
                    }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b", minWidth: "60px", textAlign: "right" }}>
                    {item.count} students
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
