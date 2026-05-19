import React, { useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";


export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [show,     setShow]     = useState(false);

  const isAdmin = window.location.pathname === "/admin-login";

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.token) {
        /* ── Save all fields to localStorage ── */
        localStorage.setItem("token",          data.token);
        localStorage.setItem("name",           data.user.name           || "");
        localStorage.setItem("role",           data.user.role           || "");
        localStorage.setItem("user_id",        data.user.user_id        || "");
        localStorage.setItem("skills",         data.user.skills         || "");
        localStorage.setItem("preferred_role", data.user.preferred_role || "");

        window.location.href =
          data.user.role === "admin" ? "/admin-dashboard" : "/student-dashboard";
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div style={{
      minHeight: "80vh", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px",
        padding: "40px 36px", width: "100%", maxWidth: "400px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            width: "52px", height: "52px", margin: "0 auto 14px",
            background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
            borderRadius: "14px", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "22px", fontWeight: "800", color: "#0f172a",
          }}>P</div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.03em" }}>
            {isAdmin ? "Admin Login" : "Student Login"}
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#94a3b8" }}>
            {isAdmin ? "Access the admin control panel" : "Sign in to your placement portal"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: "10px", padding: "10px 14px",
            marginBottom: "16px", fontSize: "13px", color: "#DC2626",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email" placeholder="you@college.edu"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey} style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "22px" }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              style={{ ...inputStyle, paddingRight: "44px" }}
            />
            <button onClick={() => setShow(!show)} style={eyeBtn}>
              {show ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleLogin} disabled={loading}
          style={{
            width: "100%", padding: "13px",
            background: loading ? "#93c5fd" : "linear-gradient(135deg, #3B82F6, #2563eb)",
            color: "#fff", border: "none", borderRadius: "12px",
            fontSize: "15px", fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in…" : (isAdmin ? "Access Admin Panel" : "Sign In →")}
        </button>

        {!isAdmin && (
          <p style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: "#64748b" }}>
            Don't have an account?{" "}
            <a href="/register" style={{ color: "#3B82F6", fontWeight: "600", textDecoration: "none" }}>
              Register here
            </a>
          </p>
        )}
        {isAdmin && (
          <p style={{ textAlign: "center", marginTop: "18px", fontSize: "12px", color: "#94a3b8" }}>
            Student?{" "}
            <a href="/login" style={{ color: "#3B82F6", fontWeight: "600", textDecoration: "none" }}>
              Student Login
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: "12px", fontWeight: "700",
  color: "#475569", marginBottom: "6px",
  letterSpacing: "0.04em", textTransform: "uppercase",
};
const inputStyle = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #e2e8f0", borderRadius: "10px",
  fontSize: "14px", color: "#0f172a", outline: "none",
  boxSizing: "border-box", background: "#f8fafc",
};
const eyeBtn = {
  position: "absolute", right: "12px", top: "50%",
  transform: "translateY(-50%)",
  background: "none", border: "none",
  cursor: "pointer", fontSize: "16px", color: "#94a3b8", padding: 0,
};
