require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const symptomRoutes = require("./routes/symptomRoutes");
const communityRoutes = require("./routes/communityRoutes");
const { attachCurrentUser } = require("./middleware/auth");
const { connectDatabase, isDbConnected } = require("./data/userStore");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection
connectDatabase().catch(err => console.error("Database initialization error:", err));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(express.json({ limit: "50kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 4
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