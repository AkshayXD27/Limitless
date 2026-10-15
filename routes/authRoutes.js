const express = require("express");
const bcrypt = require("bcryptjs");
const { users } = require("../data/userStore");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
    return res.status(400).json({ error: "Enter your name, a valid email, and a password of at least 8 characters." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (users.has(normalizedEmail)) {
    return res.status(409).json({ error: "An account with this email already exists. Please log in." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  users.set(normalizedEmail, {
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    profile: null
  });

  req.session.userEmail = normalizedEmail;
  res.json({ next: "/onboarding" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = users.get(normalizedEmail);

  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
    return res.status(401).json({ error: "Email or password was not recognized." });
  }

  req.session.userEmail = normalizedEmail;
  res.json({ next: user.profile ? "/dashboard" : "/onboarding" });
});

module.exports = router;
