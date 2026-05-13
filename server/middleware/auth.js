const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "SECRET123";

/**
 * Auth middleware
 * Accepts token from:
 *   - Authorization header (raw token)
 *   - Authorization header with "Bearer " prefix
 */
module.exports = function auth(req, res, next) {
  const header = req.header("Authorization") || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : header;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token. Please log in again." });
  }
};