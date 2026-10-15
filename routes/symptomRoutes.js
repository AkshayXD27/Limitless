const express = require("express");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

// Demo-only educational rules, not a diagnostic or validated triage engine.
// Have clinical experts review and test all safety guidance before any real-world use.
router.post("/guidance", requireLogin, (req, res) => {
  const description = String(req.body.description || "").trim();
  if (!description) {
    return res.status(400).json({ error: "Describe what you have been experiencing first." });
  }

  const text = description.toLowerCase();
  const urgent = /severe pain|faint(ing)?|passed out|heavy bleeding|soaking.*pad|difficulty breathing|chest pain/.test(text);
  const period = /period|menstrual|మాసిక|పీరియడ|ಪಿರಿಯಡ್|माहवारी|पीरियड/.test(text);
  const acne = /acne|pimple|మొటిమ|ಮೊಡವೆ|मुंहासे/.test(text);

  let result;
  if (urgent) {
    result = {
      title: "Please seek urgent medical assessment",
      message: "Some symptoms you mentioned can need prompt or emergency assessment. If symptoms are severe, sudden, or worsening, contact local emergency services or go to the nearest emergency department. This tool cannot rule out a serious cause.",
      level: "urgent"
    };
  } else if (period || acne) {
    result = {
      title: "What these symptoms could mean",
      message: "Menstrual-cycle changes and acne can sometimes occur with PCOS, but they can also have other causes. This description alone cannot confirm or rule out PCOS. Consider booking an appointment with a qualified healthcare professional, especially if changes persist, and note when symptoms began.",
      level: "routine"
    };
  } else {
    result = {
      title: "Let's understand this more clearly",
      message: "Symptoms can have several possible explanations. Track when they started, how often they occur, how severe they feel, and any changes over time. If symptoms persist, worsen, or concern you, consult a qualified healthcare professional. Seek urgent care for severe or sudden symptoms.",
      level: "routine"
    };
  }

  res.json({ result });
});

module.exports = router;
