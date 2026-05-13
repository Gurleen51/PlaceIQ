const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:       { type: String, required: true },
    role:           { type: String, enum: ["student", "admin"], default: "student" },
    user_id:        { type: String, unique: true, sparse: true },

    /* Student profile fields */
    skills:         { type: String, default: "" },
    education:      { type: String, default: "" },
    experience:     { type: String, default: "" },
    preferred_role: { type: String, default: "" },

    /* Resume upload */
    resume: {
      filename:   String,
      path:       String,
      uploadedAt: Date,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
  }
);

/* Index for fast lookup by user_id and role */
userSchema.index({ user_id: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);