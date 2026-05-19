import React, { useEffect, useState } from "react";
import {

  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const COLORS = ["#3B82F6", "#22c55e", "#F59E0B", "#EF4444"];
const ICONS  = ["💼", "📈", "🚀", "⭐"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1e293b", color: "#fff", padding: "10px 14px",
        borderRadius: "10px", fontSize: "13px",
      }}>
        <p style={{ margin: 0, fontWeight: "700" }}>{payload[0].payload.range}</p>
        <p style={{ margin: "4px 0 0", color: "#94d2ff" }}>{payload[0].value} job postings</p>
      </div>
    );
  }
  return null;
};

function Salary() {
  const [salary, setSalary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/salary-data`)
      .then(res => res.json())
      .then(data => { setSalary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const total = salary.reduce((s, x) => s + x.count, 0);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>
          Salary Insights
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
          Distribution of offered packages across {total} job postings
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>Loading salary data…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
            {salary.map((item, i) => {
              const pct = total ? ((item.count / total) * 100).toFixed(1) : 0;
              return (
                <div key={i} style={{
                  background: "#fff", borderRadius: "14px",
                  padding: "18px 20px", border: "1px solid #e2e8f0",
                  borderTop: `4px solid ${COLORS[i % COLORS.length]}`,
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "8px" }}>{ICONS[i % ICONS.length]}</div>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#475569" }}>
                    {item.range}
                  </p>
                  <p style={{ margin: "4px 0 6px", fontSize: "28px", fontWeight: "800", color: COLORS[i % COLORS.length], letterSpacing: "-0.04em" }}>
                    {item.count}
                  </p>
                  <div style={{ background: "#f1f5f9", height: "5px", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: COLORS[i % COLORS.length], borderRadius: "5px",
                    }} />
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                    {pct}% of all jobs
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
            {/* Bar chart */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                Jobs by Salary Range
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#94a3b8" }}>
                Number of postings in each LPA bracket
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={salary} barSize={42}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {salary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    <LabelList dataKey="count" position="top" style={{ fill: "#0f172a", fontSize: 12, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                Package Distribution
              </h3>
              <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#94a3b8" }}>
                Proportional breakdown by salary band
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={salary} dataKey="count" nameKey="range"
                    cx="50%" cy="48%" outerRadius={95} innerRadius={45}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {salary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                {salary.map((item, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#475569" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "2px", background: COLORS[i % COLORS.length], display: "inline-block" }} />
                    {item.range}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Insight banner */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            borderRadius: "14px", padding: "20px 24px", marginTop: "20px",
            display: "flex", alignItems: "center", gap: "16px",
          }}>
            <div style={{ fontSize: "28px" }}>💡</div>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.7" }}>
              <span style={{ color: "#6EE7B7", fontWeight: "700" }}>Salary Insight: </span>
              Most companies offer packages in the <strong style={{ color: "#fff" }}>3–6 LPA</strong> range for campus recruits.
              Students with niche skills (Cloud, ML, DevOps) consistently attract <strong style={{ color: "#fff" }}>10+ LPA</strong> offers.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Salary;
