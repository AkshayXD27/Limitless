const express = require("express");
const { requireLogin } = require("../middleware/auth");
const { updateUserProfile } = require("../data/userStore");

const router = express.Router();

router.post("/", requireLogin, async (req, res) => {
  try {
    const {
      age, height, weight, medicalHistory, familyHistory,
      symptoms, workHistory, medications, language
    } = req.body || {};

    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);

    if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 120 ||
        !Number.isFinite(heightNum) || heightNum < 50 || heightNum > 250 ||
        !Number.isFinite(weightNum) || weightNum < 20 || weightNum > 500) {
      return res.status(400).json({
        error: "Please check age, height, and weight. Use age 13–120, height 50–250 cm, and weight 20–500 kg."
      });
    }

    const profileData = {
      age: ageNum,
      height: heightNum,
      weight: weightNum,
      medicalHistory: String(medicalHistory || "").slice(0, 3000),
      familyHistory: String(familyHistory || "").slice(0, 3000),
      symptoms: String(symptoms || "").slice(0, 3000),
      workHistory: String(workHistory || "").slice(0, 2000),
      medications: String(medications || "").slice(0, 2000),
      language: ["English", "Telugu", "Hindi", "Kannada", "Tamil"].includes(language) ? language : "English"
    };

    await updateUserProfile(req.currentUser.email, profileData);
    req.currentUser.profile = profileData;

    res.json({ next: "/dashboard" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile. Please try again." });
  }
});

module.exports = router;
