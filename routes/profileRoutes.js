const express = require("express");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireLogin, (req, res) => {
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

  req.currentUser.profile = {
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

  res.json({ next: "/dashboard" });
});


// Update the extended private profile from the dashboard without requiring onboarding again.
router.patch("/", requireLogin, (req, res) => {
  const body = req.body || {};
  const profile = req.currentUser.profile || {};
  const languageOptions = ["English", "Telugu", "Hindi", "Kannada", "Tamil"];
  profile.region = String(body.region ?? profile.region ?? "").trim().slice(0, 120);
  profile.medicalHistory = String(body.medicalHistory ?? profile.medicalHistory ?? "").slice(0, 3000);
  profile.prescriptions = String(body.prescriptions ?? profile.prescriptions ?? "").slice(0, 3000);
  profile.medications = String(body.medications ?? profile.medications ?? "").slice(0, 2000);
  if (languageOptions.includes(body.language)) profile.language = body.language;
  req.currentUser.profile = profile;
  res.json({ ok: true, profile: { region: profile.region, language: profile.language } });
});

module.exports = router;
