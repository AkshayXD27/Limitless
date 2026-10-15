const express = require("express");
const bcrypt = require("bcryptjs");
const {
  findUserByEmail,
  createUser,
  syncFirebaseUser
} = require("../data/userStore");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
      return res.status(400).json({ error: "Enter your name, a valid email, and a password of at least 8 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists. Please log in." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      authProvider: "local",
      profile: null
    });

    req.session.userEmail = normalizedEmail;
    res.json({ next: "/onboarding" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user || !user.passwordHash || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
      return res.status(401).json({ error: "Email or password was not recognized." });
    }

    req.session.userEmail = normalizedEmail;
    res.json({ next: user.profile ? "/dashboard" : "/onboarding" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/firebase-sync", async (req, res) => {
  try {
    const { email, name, firebaseUid, authProvider } = req.body || {};
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "A valid email is required to sync account." });
    }

    const user = await syncFirebaseUser({
      email,
      name,
      firebaseUid,
      authProvider: authProvider || "firebase"
    });

    req.session.userEmail = user.email;
    res.json({
      next: user.profile ? "/dashboard" : "/onboarding",
      user: {
        name: user.name,
        email: user.email,
        hasProfile: Boolean(user.profile)
      }
    });
  } catch (err) {
    console.error("Firebase sync error:", err);
    res.status(500).json({ error: "Failed to synchronize user session." });
  }
});

module.exports = router;
