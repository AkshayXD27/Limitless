const express = require("express");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

function getLocalGuidance(description) {
  const text = description.toLowerCase();
  const urgent = /severe pain|faint(ing)?|passed out|heavy bleeding|soaking.*pad|difficulty breathing|chest pain/.test(text);
  const period = /period|menstrual|మాసిక|పీరియడ|ಪಿರಿಯಡ್|माहवारी|पीरियड/.test(text);
  const acne = /acne|pimple|మొటిమ|ಮೊಡವೆ|मुंहासे/.test(text);

  if (urgent) {
    return {
      title: "Please seek urgent medical assessment",
      message: "Some symptoms you mentioned can need prompt or emergency assessment. If symptoms are severe, sudden, or worsening, contact local emergency services or go to the nearest emergency department. This tool cannot rule out a serious cause.",
      level: "urgent"
    };
  } else if (period || acne) {
    return {
      title: "What these symptoms could mean",
      message: "Menstrual-cycle changes and acne can sometimes occur with PCOS, but they can also have other causes. This description alone cannot confirm or rule out PCOS. Consider booking an appointment with a qualified healthcare professional, especially if changes persist, and note when symptoms began.",
      level: "routine"
    };
  } else {
    return {
      title: "Let's understand this more clearly",
      message: "Symptoms can have several possible explanations. Track when they started, how often they occur, how severe they feel, and any changes over time. If symptoms persist, worsen, or concern you, consult a qualified healthcare professional. Seek urgent care for severe or sudden symptoms.",
      level: "routine"
    };
  }
}

async function getAiGatewayGuidance(description, userLanguage = "English") {
  const token = process.env.NEON_AI_GATEWAY_TOKEN;
  const baseUrl = process.env.NEON_AI_GATEWAY_BASE_URL;

  if (!token || !baseUrl) return null;

  try {
    const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
    const prompt = `You are a supportive, culturally sensitive, non-diagnostic women's health guidance assistant named Sakhi Health.
The user described their symptoms: "${description}".
User's preferred language: ${userLanguage}.
Provide a gentle educational response in 2-3 short sentences. Clarify that this is educational guidance and not a medical diagnosis. If symptoms seem critical, advise consulting emergency services. Respond in pure JSON format with keys "title", "message", and "level" (where level is "urgent" or "routine").`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Neon AI Gateway] API returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (err) {
    console.warn("[Neon AI Gateway] Request failed, using fallback:", err.message);
  }
  return null;
}

router.post("/guidance", requireLogin, async (req, res) => {
  const description = String(req.body.description || "").trim();
  if (!description) {
    return res.status(400).json({ error: "Describe what you have been experiencing first." });
  }

  const preferredLanguage = req.currentUser?.profile?.language || "English";
  let result = await getAiGatewayGuidance(description, preferredLanguage);

  if (!result || !result.title || !result.message) {
    result = getLocalGuidance(description);
  }

  res.json({ result });
});

module.exports = router;
