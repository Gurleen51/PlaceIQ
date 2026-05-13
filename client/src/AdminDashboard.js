import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

const COLORS = ["#3B82F6", "#22c55e", "#EF4444"];

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: localStorage.getItem("token") || "",
});

/* ── Reusable components ── */
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "14px", padding: "20px 22px",
      border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "14px",
    }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px",
        background: color + "18", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0,
      }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: "26px", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.04em" }}>{value}</p>
      </div>
    </div>
  );
}

function TabBtn({ label, active, count, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 20px", borderRadius: "10px", border: "none",
      cursor: "pointer", fontSize: "13px", fontWeight: "700",
      background: active ? "#0f172a" : "#f1f5f9",
      color: active ? "#fff" : "#475569",
      display: "flex", alignItems: "center", gap: "7px",
      transition: "all 0.15s",
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          fontSize: "11px", padding: "1px 7px", borderRadius: "20px",
          background: active ? "rgba(255,255,255,0.2)" : "#e2e8f0",
          color: active ? "#fff" : "#64748b",
        }}>{count}</span>
      )}
    </button>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: "700",
        color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em",
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: "100%", padding: "9px 12px", boxSizing: "border-box",
          borderRadius: "9px", border: "1.5px solid #e2e8f0",
          fontSize: "13px", color: "#0f172a", outline: "none", background: "#f8fafc",
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function AdminDashboard() {
  const [stats,            setStats]            = useState({});
  const [students,         setStudents]         = useState([]);
  const [jobs,             setJobs]             = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredJobs,     setFilteredJobs]     = useState([]);
  const [searchStudent,    setSearchStudent]    = useState("");
  const [searchJob,        setSearchJob]        = useState("");
  const [activeTab,        setActiveTab]        = useState("overview");
  const [loading,          setLoading]          = useState(true);

  // Job form
  const [editId,   setEditId]   = useState(null);
  const [company,  setCompany]  = useState("");
  const [title,    setTitle]    = useState("");
  const [location, setLocation] = useState("");
  const [salary,   setSalary]   = useState("");
  const [openings, setOpenings] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Toast
  const [toast,     setToast]     = useState("");
  const [toastType, setToastType] = useState("success");

  // Admin management
  const [admins,        setAdmins]        = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminName,     setAdminName]     = useState("");
  const [adminEmail,    setAdminEmail]    = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSaving,   setAdminSaving]   = useState(false);
  const [showAdminPwd,  setShowAdminPwd]  = useState(false);

  useEffect(() => { loadData(); }, []);

  // Load admins fresh each time the tab is opened
  useEffect(() => {
    if (activeTab === "admins") loadAdmins();
  }, [activeTab]);

  const showToast = (msg, type = "success") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 3500);
  };

  /* ── Load main data ── */
  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: localStorage.getItem("token") || "" };
      const [statsData, stuData, jobData] = await Promise.all([
        fetch("http://localhost:5000/admin-stats",    { headers }).then(r => r.json()),
        fetch("http://localhost:5000/admin-students", { headers }).then(r => r.json()),
        fetch("http://localhost:5000/admin-jobs",     { headers }).then(r => r.json()),
      ]);
      setStats(statsData);
      setStudents(Array.isArray(stuData) ? stuData : []);
      setFilteredStudents(Array.isArray(stuData) ? stuData : []);
      setJobs(Array.isArray(jobData) ? jobData : []);
      setFilteredJobs(Array.isArray(jobData) ? jobData : []);
    } catch {
      showToast("Failed to load data. Check server connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Load admins ── */
  const loadAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/admin/list-admins", {
        headers: { Authorization: localStorage.getItem("token") || "" },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(Array.isArray(data) ? data : []);
      } else {
        showToast(data.error || "Failed to load admins.", "error");
        setAdmins([]);
      }
    } catch {
      showToast("Server error while loading admins.", "error");
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };

  /* ── Search ── */
  const handleStudentSearch = (q) => {
    setSearchStudent(q);
    const k = q.toLowerCase();
    setFilteredStudents(students.filter(s =>
      (s.name   || "").toLowerCase().includes(k) ||
      (s.email  || "").toLowerCase().includes(k) ||
      (s.skills || "").toLowerCase().includes(k)
    ));
  };

  const handleJobSearch = (q) => {
    setSearchJob(q);
    const k = q.toLowerCase();
    setFilteredJobs(jobs.filter(j =>
      (j.company_name || "").toLowerCase().includes(k) ||
      (j.job_title    || "").toLowerCase().includes(k) ||
      (j.location     || "").toLowerCase().includes(k)
    ));
  };

  /* ── Delete student / job ── */
  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student permanently?")) return;
    const res = await fetch(`http://localhost:5000/delete-student/${id}`, {
      method: "DELETE", headers: { Authorization: localStorage.getItem("token") || "" },
    });
    if (res.ok) { showToast("Student deleted."); loadData(); }
    else        showToast("Failed to delete student.", "error");
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Delete this job posting?")) return;
    const res = await fetch(`http://localhost:5000/delete-job/${id}`, {
      method: "DELETE", headers: { Authorization: localStorage.getItem("token") || "" },
    });
    if (res.ok) { showToast("Job deleted."); loadData(); }
    else        showToast("Failed to delete job.", "error");
  };

  /* ── Job form helpers ── */
  const openForm  = () => { clearForm(); setEditId(null); setFormOpen(true); };
  const startEdit = (job) => {
    setEditId(job._id); setCompany(job.company_name); setTitle(job.job_title);
    setLocation(job.location); setSalary(job.offered_salary_lpa); setOpenings(job.openings);
    setFormOpen(true);
  };
  const clearForm = () => { setCompany(""); setTitle(""); setLocation(""); setSalary(""); setOpenings(""); };

  const saveJob = async () => {
    if (!company || !title) { showToast("Company and Job Title are required.", "error"); return; }
    setSaving(true);
    const body    = JSON.stringify({ company_name: company, job_title: title, location, offered_salary_lpa: salary, openings });
    const headers = authHeaders();
    try {
      const res = editId
        ? await fetch(`http://localhost:5000/update-job/${editId}`, { method: "PUT",  headers, body })
        : await fetch("http://localhost:5000/add-job",              { method: "POST", headers, body });
      const data = await res.json();
      if (res.ok) {
        showToast(editId ? "Job updated." : "Job added.");
        setFormOpen(false); setEditId(null); clearForm(); loadData();
      } else {
        showToast(data.error || "Save failed.", "error");
      }
    } catch {
      showToast("Server error.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── Create admin ── */
  const createAdmin = async () => {
    if (!adminName || !adminEmail || !adminPassword) {
      showToast("All fields are required.", "error"); return;
    }
    if (adminPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error"); return;
    }
    setAdminSaving(true);
    try {
      const res  = await fetch("http://localhost:5000/admin/create-admin", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: adminName, email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Admin created successfully.");
        setAdminName(""); setAdminEmail(""); setAdminPassword("");
        loadAdmins();
      } else {
        showToast(data.error || "Failed to create admin.", "error");
      }
    } catch {
      showToast("Server error.", "error");
    } finally {
      setAdminSaving(false);
    }
  };

  /* ── Delete admin ── */
  const deleteAdmin = async (id, name) => {
    if (!window.confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`http://localhost:5000/admin/delete-admin/${id}`, {
        method: "DELETE", headers: { Authorization: localStorage.getItem("token") || "" },
      });
      const data = await res.json();
      if (res.ok) { showToast(data.message); loadAdmins(); }
      else showToast(data.error || "Failed to delete admin.", "error");
    } catch {
      showToast("Server error.", "error");
    }
  };

  /* ── Password strength indicator ── */
  const pwdStrength = adminPassword.length === 0 ? null
    : adminPassword.length < 6  ? { label: "Weak",   color: "#EF4444", bars: 1 }
    : adminPassword.length < 10 ? { label: "Good",   color: "#F59E0B", bars: 2 }
    : adminPassword.length < 14 ? { label: "Strong", color: "#3B82F6", bars: 3 }
    :                              { label: "Very Strong", color: "#22c55e", bars: 4 };

  const chartData = [
    { name: "Students", value: stats.totalStudents || 0 },
    { name: "Jobs",     value: stats.totalJobs     || 0 },
    { name: "Matches",  value: stats.totalMatches  || 0 },
  ];

  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          background: toastType === "error" ? "#FEF2F2" : "#0f172a",
          color:      toastType === "error" ? "#DC2626"  : "#6EE7B7",
          border:     toastType === "error" ? "1px solid #FECACA" : "none",
          padding: "12px 20px", borderRadius: "12px",
          fontSize: "13px", fontWeight: "700",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999,
        }}>
          {toastType === "error" ? "⚠️" : "✓"} {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>Admin Dashboard</h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>Manage students, jobs, and placement analytics</p>
        </div>
        <span style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "20px", background: "#fef9c3", color: "#92400e", fontWeight: "700" }}>
          👑 Admin Mode
        </span>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <StatCard label="Total Students" value={loading ? "…" : stats.totalStudents || 0} icon="👥" color="#3B82F6" />
        <StatCard label="Job Postings"   value={loading ? "…" : stats.totalJobs     || 0} icon="💼" color="#22c55e" />
        <StatCard label="Total Matches"  value={loading ? "…" : stats.totalMatches  || 0} icon="🎯" color="#EF4444" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "22px", flexWrap: "wrap" }}>
        <TabBtn label="Overview"    active={activeTab === "overview"}  onClick={() => setActiveTab("overview")} />
        <TabBtn label="Manage Jobs" count={jobs.length}     active={activeTab === "jobs"}     onClick={() => setActiveTab("jobs")} />
        <TabBtn label="Students"    count={students.length} active={activeTab === "students"} onClick={() => setActiveTab("students")} />
        <TabBtn label="👑 Admins"   count={admins.length}   active={activeTab === "admins"}   onClick={() => setActiveTab("admins")} />
      </div>

      {/* ══════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════ */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Platform Statistics</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "22px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} dataKey="value" cx="50%" cy="46%" outerRadius={85} innerRadius={38}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: "14px", marginTop: "10px" }}>
              {chartData.map((d, i) => (
                <span key={i} style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: COLORS[i], display: "inline-block" }} />{d.name}
                </span>
              ))}
            </div>
            <div style={{ marginTop: "18px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
              {[
                { label: "Eligible Students",  value: `${stats.totalStudents || 0}` },
                { label: "Active Job Postings", value: `${stats.totalJobs || 0}` },
                { label: "Total Matches",       value: `${stats.totalMatches || 0}` },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{item.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          JOBS TAB
      ══════════════════════════════════ */}
      {activeTab === "jobs" && (
        <>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
              <input value={searchJob} onChange={e => handleJobSearch(e.target.value)} placeholder="Search jobs…"
                style={{ width: "100%", padding: "9px 12px 9px 36px", boxSizing: "border-box", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", outline: "none" }} />
            </div>
            <button onClick={openForm} style={{ padding: "9px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Add Job
            </button>
          </div>

          {formOpen && (
            <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "22px", marginBottom: "16px" }}>
              <h4 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                {editId ? "✏️ Edit Job Posting" : "➕ New Job Posting"}
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <InputField label="Company"      value={company}  onChange={e => setCompany(e.target.value)}  placeholder="e.g. Infosys" />
                <InputField label="Job Title"    value={title}    onChange={e => setTitle(e.target.value)}    placeholder="e.g. Data Analyst" />
                <InputField label="Location"     value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore" />
                <InputField label="Salary (LPA)" value={salary}   onChange={e => setSalary(e.target.value)}   placeholder="e.g. 8" type="number" />
                <InputField label="Openings"     value={openings} onChange={e => setOpenings(e.target.value)} placeholder="e.g. 10" type="number" />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button onClick={saveJob} disabled={saving} style={{ padding: "9px 22px", background: saving ? "#94a3b8" : "#0f172a", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : editId ? "Update Job" : "Save Job"}
                </button>
                <button onClick={() => { setFormOpen(false); setEditId(null); clearForm(); }} style={{ padding: "9px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Company", "Role", "Location", "Salary (LPA)", "Openings", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700", color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, i) => (
                    <tr key={job._id} style={{ borderBottom: i < filteredJobs.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0f172a" }}>{job.company_name}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{job.job_title}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{job.location || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {job.offered_salary_lpa
                          ? <span style={{ fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "20px", background: "#dcfce7", color: "#15803d" }}>{job.offered_salary_lpa} LPA</span>
                          : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{job.openings || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => startEdit(job)} style={actionBtn("#eff6ff", "#2563eb")}>Edit</button>
                          <button onClick={() => deleteJob(job._id)} style={actionBtn("#fef2f2", "#b91c1c")}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredJobs.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                {loading ? "Loading jobs…" : "No jobs found."}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════
          STUDENTS TAB
      ══════════════════════════════════ */}
      {activeTab === "students" && (
        <>
          <div style={{ position: "relative", marginBottom: "16px", maxWidth: "400px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
            <input value={searchStudent} onChange={e => handleStudentSearch(e.target.value)} placeholder="Search by name, email or skill…"
              style={{ width: "100%", padding: "9px 12px 9px 36px", boxSizing: "border-box", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#0f172a", outline: "none" }} />
          </div>

          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Student", "Email", "Skills", "Preferred Role", "Registered", "Action"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700", color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => {
                    const skillList  = (s.skills || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 3);
                    const extraCount = (s.skills || "").split(",").filter(Boolean).length - 3;
                    const regDate    = s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—";
                    return (
                      <tr key={s._id} style={{ borderBottom: i < filteredStudents.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #6EE7B7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", color: "#fff", flexShrink: 0 }}>
                              {(s.name || "?")[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{s.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {skillList.map(sk => (
                              <span key={sk} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb", fontWeight: "600" }}>{sk}</span>
                            ))}
                            {extraCount > 0 && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "#f1f5f9", color: "#64748b" }}>+{extraCount}</span>}
                            {skillList.length === 0 && <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{s.preferred_role || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "12px" }}>{regDate}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => deleteStudent(s._id)} style={actionBtn("#fef2f2", "#b91c1c")}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                {loading ? "Loading students…" : "No students found."}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════
          ADMINS TAB
      ══════════════════════════════════ */}
      {activeTab === "admins" && (
        <div>

          {/* ── Create Admin Form Card ── */}
          <div style={{
            background: "#fff", borderRadius: "16px",
            border: "1px solid #e2e8f0", marginBottom: "24px",
            overflow: "hidden",
          }}>
            {/* Card header banner */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
              padding: "20px 24px",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", flexShrink: 0,
              }}>👑</div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#fff" }}>
                  Add New Admin
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>
                  Create a new administrator with full dashboard access
                </p>
              </div>
            </div>

            {/* Form body */}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "16px" }}>

                {/* Full Name */}
                <div>
                  <label style={adminLabel}>Full Name</label>
                  <input
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    style={adminInput}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={adminLabel}>Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@college.edu"
                    style={adminInput}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={adminLabel}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showAdminPwd ? "text" : "password"}
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      style={{ ...adminInput, paddingRight: "40px" }}
                    />
                    <button
                      onClick={() => setShowAdminPwd(!showAdminPwd)}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#94a3b8" }}
                    >{showAdminPwd ? "🙈" : "👁️"}</button>
                  </div>
                </div>
              </div>

              {/* Password strength bar */}
              {pwdStrength && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        width: "36px", height: "4px", borderRadius: "4px",
                        background: i <= pwdStrength.bars ? pwdStrength.color : "#e2e8f0",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: pwdStrength.color }}>
                    {pwdStrength.label}
                  </span>
                </div>
              )}

              {/* Submit */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={createAdmin}
                  disabled={adminSaving}
                  style={{
                    padding: "11px 28px",
                    background: adminSaving ? "#94a3b8" : "linear-gradient(135deg, #F59E0B, #EF4444)",
                    color: "#fff", border: "none", borderRadius: "10px",
                    fontSize: "14px", fontWeight: "700",
                    cursor: adminSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {adminSaving ? "⏳ Creating…" : "👑 Create Admin Account"}
                </button>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                  ⚠️ Share credentials securely with the new admin.
                </p>
              </div>
            </div>
          </div>

          {/* ── Admin List ── */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{
              padding: "16px 22px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>All Admins</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  {adminsLoading ? "Loading…" : `${admins.length} admin account${admins.length !== 1 ? "s" : ""} registered`}
                </p>
              </div>
              <button
                onClick={loadAdmins}
                style={{ padding: "7px 14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
              >
                🔄 Refresh
              </button>
            </div>

            {adminsLoading ? (
              <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8" }}>
                Loading admins…
              </div>
            ) : admins.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <p style={{ fontSize: "32px", margin: "0 0 10px" }}>👑</p>
                <p style={{ margin: 0, fontWeight: "700", color: "#0f172a" }}>No admins found</p>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                  Use the form above to create the first admin account.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Admin", "Email", "User ID", "Created", "Action"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700", color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, i) => {
                      const isSelf  = admin.user_id === localStorage.getItem("user_id");
                      const regDate = admin.createdAt
                        ? new Date(admin.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—";
                      return (
                        <tr key={admin._id} style={{
                          borderBottom: i < admins.length - 1 ? "1px solid #f1f5f9" : "none",
                          background: isSelf ? "#fffbeb" : "#fff",
                        }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{
                                width: "34px", height: "34px", borderRadius: "50%",
                                background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "13px", fontWeight: "800", color: "#fff", flexShrink: 0,
                              }}>
                                {(admin.name || "A")[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{admin.name}</p>
                                {isSelf && (
                                  <span style={{ fontSize: "10px", padding: "1px 7px", borderRadius: "20px", background: "#fef9c3", color: "#92400e", fontWeight: "700" }}>
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748b" }}>{admin.email}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <code style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 7px", borderRadius: "5px", color: "#475569" }}>
                              {admin.user_id}
                            </code>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: "12px" }}>{regDate}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {isSelf ? (
                              <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>Current session</span>
                            ) : (
                              <button onClick={() => deleteAdmin(admin._id, admin.name)} style={actionBtn("#fef2f2", "#b91c1c")}>
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const actionBtn = (bg, color) => ({
  fontSize: "12px", fontWeight: "700", padding: "5px 12px",
  borderRadius: "8px", border: "none", cursor: "pointer",
  background: bg, color,
});

const adminLabel = {
  display: "block", fontSize: "11px", fontWeight: "700",
  color: "#374151", marginBottom: "5px",
  textTransform: "uppercase", letterSpacing: "0.05em",
};

const adminInput = {
  width: "100%", padding: "9px 12px", boxSizing: "border-box",
  borderRadius: "9px", border: "1.5px solid #e2e8f0",
  fontSize: "13px", color: "#0f172a", outline: "none", background: "#f8fafc",
};