import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

import Dashboard       from "./Dashboard";
import Jobs            from "./Jobs";
import Skills          from "./Skills";
import Salary          from "./Salary";
import Matches         from "./Matches";
import Login           from "./Login";
import Register        from "./Register";
import ProtectedRoute  from "./ProtectedRoute";
import StudentDashboard from "./StudentDashboard";
import AdminDashboard  from "./AdminDashboard";

const NAV_ITEMS_PUBLIC = [
  { to: "/",       label: "Overview",       icon: "⬡" },
  { to: "/jobs",   label: "Job Listings",   icon: "◈" },
  { to: "/skills", label: "Skill Analytics",icon: "◆" },
  { to: "/salary", label: "Salary Insights",icon: "◇" },
];

function SidebarLink({ to, label, icon }) {
  const location = useLocation();
  const active   = location.pathname === to;
  return (
    <Link
      to={to}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 14px", borderRadius: "10px",
        textDecoration: "none", fontSize: "14px",
        fontWeight: active ? "600" : "400",
        color:      active ? "#fff" : "rgba(255,255,255,0.6)",
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        borderLeft: active ? "3px solid #6EE7B7" : "3px solid transparent",
        transition: "all 0.18s ease",
        letterSpacing: "0.01em",
      }}
    >
      <span style={{ fontSize: "16px", lineHeight: 1 }}>{icon}</span>
      {label}
    </Link>
  );
}

const SIDEBAR_W = 230; // px — single source of truth

function AppLayout() {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");
  const name  = localStorage.getItem("name");

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    /*
      Outer shell fills the viewport exactly.
      overflow:hidden prevents the BODY from scrolling.
      Only the <main> element scrolls.
    */
    <div style={{
      display: "flex",
      height: "100vh",          /* ← exact viewport height, never grows */
      overflow: "hidden",       /* ← no body scroll */
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ════════════════════════════════
          SIDEBAR  — fixed-height, never scrolls
      ════════════════════════════════ */}
      <aside style={{
        width: `${SIDEBAR_W}px`,
        minWidth: `${SIDEBAR_W}px`,
        height: "100vh",          /* ← always full viewport height */
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        /* sidebar itself does NOT scroll */
        overflowY: "hidden",
      }}>

        {/* Brand — fixed at top */}
        <div style={{
          padding: "24px 20px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,           /* ← never shrinks */
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "34px", height: "34px",
              background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
              borderRadius: "9px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: "700", color: "#0f172a",
            }}>P</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "-0.02em" }}>PlaceIQ</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "1px" }}>Placement Portal</div>
            </div>
          </div>
        </div>

        {/* Nav links — scrollable if items overflow */}
        <nav style={{
          flex: 1,
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          overflowY: "auto",       /* ← nav scrolls only if it overflows */
          /* hide scrollbar visually but keep functionality */
          scrollbarWidth: "none",
        }}>
          <div style={sectionLabel}>Analytics</div>

          {NAV_ITEMS_PUBLIC.map(item => (
            <SidebarLink key={item.to} {...item} />
          ))}

          {!token && (
            <>
              <Divider />
              <div style={sectionLabel}>Access</div>
              <SidebarLink to="/login"       label="Student Login" icon="▷" />
              <SidebarLink to="/register"    label="Register"      icon="+" />
              <SidebarLink to="/admin-login" label="Admin Login"   icon="◈" />
            </>
          )}

          {token && role === "student" && (
            <>
              <Divider />
              <div style={sectionLabel}>My Panel</div>
              <SidebarLink to="/matches"           label="Job Matches"   icon="◆" />
              <SidebarLink to="/student-dashboard" label="My Dashboard"  icon="▣" />
            </>
          )}

          {token && role === "admin" && (
            <>
              <Divider />
              <div style={sectionLabel}>Admin</div>
              <SidebarLink to="/admin-dashboard" label="Admin Panel" icon="◈" />
            </>
          )}
        </nav>

        {/* User footer — fixed at bottom */}
        {token && (
          <div style={{
            padding: "14px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,         /* ← never shrinks, always visible */
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{
                width: "32px", height: "32px",
                background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#0f172a",
                flexShrink: 0,
              }}>
                {(name || "U")[0].toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{
                  fontSize: "13px", fontWeight: "600", color: "#fff",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{name || "User"}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
                  {role}
                </div>
              </div>
            </div>
            <button onClick={logout} style={{
              width: "100%", padding: "8px", fontSize: "13px",
              background: "rgba(239,68,68,0.15)", color: "#FCA5A5",
              border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px",
              cursor: "pointer", fontWeight: "600",
            }}>
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* ════════════════════════════════
          RIGHT PANEL — topbar + scrollable content
      ════════════════════════════════ */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: "100vh",           /* ← exact viewport, no overflow */
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
      }}>

        {/* Topbar — sticky at top of right panel */}
        <header style={{
          background: "#fff",
          padding: "14px 28px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,           /* ← never shrinks or scrolls away */
          zIndex: 10,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.02em" }}>
              Smart Placement Analytics
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              College Placement Intelligence System
            </p>
          </div>
          <span style={{
            fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
            background: "#dcfce7", color: "#15803d", fontWeight: "600",
          }}>
            ● Live
          </span>
        </header>

        {/* Page content — THIS is the only thing that scrolls */}
        <main style={{
          flex: 1,
          overflowY: "auto",       /* ← only main scrolls */
          padding: "24px",
        }}>
          <Routes>
            <Route path="/"                  element={<Dashboard />} />
            <Route path="/jobs"              element={<Jobs />} />
            <Route path="/skills"            element={<Skills />} />
            <Route path="/salary"            element={<Salary />} />
            <Route path="/login"             element={<Login />} />
            <Route path="/admin-login"       element={<Login />} />
            <Route path="/register"          element={<Register />} />
            <Route path="/matches"           element={<ProtectedRoute><Matches /></ProtectedRoute>} />
            <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/admin-dashboard"   element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ── Small helpers ── */
function Divider() {
  return <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "12px 0", flexShrink: 0 }} />;
}

const sectionLabel = {
  fontSize: "10px", fontWeight: "700",
  color: "rgba(255,255,255,0.3)",
  letterSpacing: "0.1em",
  padding: "4px 14px 8px",
  textTransform: "uppercase",
  flexShrink: 0,
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;