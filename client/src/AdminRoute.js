export default function AdminRoute({ children }) {
  const role = localStorage.getItem("role");

  if (role !== "admin") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "60vh",
      }}>
        <div style={{
          background: "#fff", borderRadius: "16px", padding: "40px 36px",
          border: "1px solid #e2e8f0", textAlign: "center", maxWidth: "360px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "14px" }}>🚫</div>
          <h2 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
            Admin Access Only
          </h2>
          <p style={{ margin: "0 0 22px", fontSize: "13px", color: "#64748b", lineHeight: "1.6" }}>
            You don't have permission to view this page. Please log in with an admin account.
          </p>
          <a href="/admin-login" style={{
            display: "inline-block", padding: "11px 28px",
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            color: "#fff", borderRadius: "10px", textDecoration: "none",
            fontSize: "14px", fontWeight: "700",
          }}>
            Admin Login →
          </a>
        </div>
      </div>
    );
  }

  return children;
}