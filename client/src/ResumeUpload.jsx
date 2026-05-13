import React, { useState, useRef } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ResumeUpload = ({ userId }) => {
  const [file,      setFile]      = useState(null);
  const [msg,       setMsg]       = useState("");
  const [error,     setError]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    setMsg(""); setError("");
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
    if (f.size > 5 * 1024 * 1024)    { setError("File size must be under 5 MB."); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const uploadFile = async () => {
    if (!file)   { setError("Please select a PDF file first."); return; }
    if (!userId) { setError("User ID not found. Please reload and try again."); return; }

    setUploading(true); setProgress(0);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      await axios.post(
        `${API}/upload-resume/${userId}`,
        formData,
        {
          headers: {
            /* Send auth token so the protected route accepts the request */
            Authorization: localStorage.getItem("token") || "",
          },
          onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
        }
      );
      setMsg("Resume uploaded successfully! ✓");
      setFile(null); setProgress(0);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "#3B82F6" : "#cbd5e1"}`,
          borderRadius: "12px", padding: "32px 20px",
          textAlign: "center", cursor: "pointer",
          background: dragging ? "#EFF6FF" : "#f8fafc",
          transition: "all 0.2s", marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "30px", marginBottom: "8px" }}>📎</div>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
          {file ? file.name : "Click or drag & drop your resume"}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
          PDF only · Max 5 MB
        </p>
        <input
          ref={inputRef} type="file" accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Selected file info */}
      {file && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#EFF6FF", borderRadius: "10px",
          padding: "10px 14px", marginBottom: "14px",
          border: "1px solid #BFDBFE",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>📄</span>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#1D4ED8" }}>{file.name}</p>
              <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#64748b" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); setMsg(""); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#94a3b8" }}
          >✕</button>
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Uploading…</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#3B82F6" }}>{progress}%</span>
          </div>
          <div style={{ background: "#e2e8f0", height: "6px", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: "linear-gradient(90deg, #3B82F6, #6EE7B7)",
              borderRadius: "6px", transition: "width 0.2s",
            }} />
          </div>
        </div>
      )}

      {/* Success / Error messages */}
      {msg && (
        <div style={{
          background: "#dcfce7", border: "1px solid #86efac",
          borderRadius: "10px", padding: "10px 14px",
          marginBottom: "14px", fontSize: "13px",
          color: "#15803d", fontWeight: "600",
        }}>
          {msg}
        </div>
      )}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: "10px", padding: "10px 14px",
          marginBottom: "14px", fontSize: "13px", color: "#DC2626",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={uploadFile}
        disabled={uploading || !file}
        style={{
          width: "100%", padding: "12px",
          background: uploading || !file
            ? "#e2e8f0"
            : "linear-gradient(135deg, #3B82F6, #2563eb)",
          color: uploading || !file ? "#94a3b8" : "#fff",
          border: "none", borderRadius: "10px",
          fontSize: "14px", fontWeight: "700",
          cursor: uploading || !file ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
      >
        {uploading ? "Uploading…" : "Upload Resume"}
      </button>
    </div>
  );
};

export default ResumeUpload;
