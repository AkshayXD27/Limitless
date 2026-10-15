const fs = require("fs");
const path = require("path");

// Load .env.local first (populated by neon deploy/env pull), then fallback to .env
if (fs.existsSync(path.join(__dirname, ".env.local"))) {
  require("dotenv").config({ path: path.join(__dirname, ".env.local") });
}
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const symptomRoutes = require("./routes/symptomRoutes");
const communityRoutes = require("./routes/communityRoutes");
const { attachCurrentUser } = require("./middleware/auth");
const { connectDatabase, isDbConnected, getDbPool, ensureDb } = require("./data/userStore");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Vercel / reverse proxy for secure cookies
app.set("trust proxy", 1);

// Initialize database connection
connectDatabase().catch(err => console.error("Neon Postgres initialization error:", err));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

const pool = getDbPool();
const sessionStore = pool ? new pgSession({
  pool,
  tableName: "session",
  createTableIfMissing: true
}) : undefined;

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(attachCurrentUser);

app.get("/", (req, res) => {
  if (req.currentUser) {
    return res.redirect(req.currentUser.profile ? "/dashboard" : "/onboarding");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/community", communityRoutes);

app.get("/api/health", async (req, res) => {
  const connected = await ensureDb();
  res.json({
    status: "ok",
    database: {
      connected: isDbConnected(),
      provider: "Neon Postgres",
      branch: process.env.NEON_BRANCH || "production",
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED)
    },
    aiGateway: {
      configured: Boolean(process.env.NEON_AI_GATEWAY_TOKEN && process.env.NEON_AI_GATEWAY_BASE_URL)
    },
    firebase: {
      projectId: "women-shealth",
      authDomain: "women-shealth.firebaseapp.com"
    }
  });
});

app.get("/onboarding", (req, res) => {
  if (!req.currentUser) return res.redirect("/");
  if (req.currentUser.profile) return res.redirect("/dashboard");
  res.sendFile(path.join(__dirname, "public", "onboarding.html"));
});

app.get("/dashboard", (req, res) => {
  if (!req.currentUser) return res.redirect("/");
  if (!req.currentUser.profile) return res.redirect("/onboarding");
  res.render("dashboard", {
    user: req.currentUser,
    profile: req.currentUser.profile
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.use((req, res) => {
  res.status(404).send("Page not found. <a href='/'>Return to Sakhi Health</a>");
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Sakhi Health is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
