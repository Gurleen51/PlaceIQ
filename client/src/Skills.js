import React, { useEffect, useState } from "react";
import {

  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PALETTE = [
  "#3B82F6","#6EE7B7","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#06B6D4","#84CC16",
];

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/skills-data`)
      .then(res => res.json())
      .then(data => { setSkills(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...skills].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 10);
  const total = skills.reduce((s, x) => s + x.count, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "#1e293b", color: "#fff", padding: "10px 14px",
          borderRadius: "10px", fontSize: "13px",
        }}>
          <p style={{ margin: 0, fontWeight: "700" }}>{payload[0].payload.skill}</p>
          <p style={{ margin: "3px 0 0", color: "#94d2ff" }}>{payload[0].value} students</p>
          <p style={{ margin: "2px 0 0", color: "#6EE7B7", fontSize: "11px" }}>
            {total ? ((payload[0].value / total) * 100).toFixed(1) : 0}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>
          Skill Analytics
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
          Skill distribution across {skills.length} categories in the student pool
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading skills…</div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            <div style={summaryCard("#3B82F6")}>
              <p style={summaryLabel}>Total Skill Types</p>
              <p style={summaryValue}>{skills.length}</p>
            </div>
            <div style={summaryCard("#22c55e")}>
              <p style={summaryLabel}>Total Skill Records</p>
              <p style={summaryValue}>{total}</p>
            </div>
            <div style={summaryCard("#F59E0B")}>
              <p style={summaryLabel}>Top Skill</p>
              <p style={{ ...summaryValue, fontSize: "16px" }}>{sorted[0]?.skill || "—"}</p>
            </div>
            <div style={summaryCard("#8B5CF6")}>
              <p style={summaryLabel}>Avg per Skill</p>
              <p style={summaryValue}>{skills.length ? (total / skills.length).toFixed(1) : 0}</p>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{
            background: "#fff", borderRadius: "16px", padding: "24px",
            border: "1px solid #e2e8f0", marginBottom: "24px",
          }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
              Top 10 Most Common Skills
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#94a3b8" }}>
              Student skill frequency — helps identify what's in demand
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top} barSize={34}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="skill"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {top.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Skill cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
            {sorted.map((item, i) => {
              const pct = total ? ((item.count / total) * 100).toFixed(1) : 0;
              const color = PALETTE[i % PALETTE.length];
              return (
                <div key={i} style={{
                  background: "#fff", borderRadius: "12px",
                  padding: "16px", border: "1px solid #e2e8f0",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a", textTransform: "capitalize" }}>
                      {item.skill}
                    </p>
                    <span style={{
                      fontSize: "11px", padding: "2px 8px", borderRadius: "20px",
                      background: color + "20", color: color, fontWeight: "700",
                    }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ background: "#f1f5f9", height: "6px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, (item.count / (sorted[0]?.count || 1)) * 100)}%`,
                      height: "100%", background: color, borderRadius: "6px",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {item.count} students
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Skills;

const summaryCard = (color) => ({
  background: "#fff", borderRadius: "12px", padding: "16px 18px",
  border: `1.5px solid ${color}30`, borderLeft: `4px solid ${color}`,
});
const summaryLabel = { margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" };
const summaryValue = { margin: "4px 0 0", fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.04em" };
