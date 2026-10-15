const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  age: { type: Number, default: null },
  height: { type: Number, default: null },
  weight: { type: Number, default: null },
  medicalHistory: { type: String, default: "" },
  familyHistory: { type: String, default: "" },
  symptoms: { type: String, default: "" },
  workHistory: { type: String, default: "" },
  medications: { type: String, default: "" },
  language: { type: String, default: "English" }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  firebaseUid: { type: String, default: null, index: true },
  authProvider: { type: String, enum: ["local", "firebase", "google"], default: "local" },
  profile: { type: ProfileSchema, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
