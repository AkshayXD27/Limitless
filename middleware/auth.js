const { users } = require("../data/userStore");

function attachCurrentUser(req, res, next) {
  const email = req.session && req.session.userEmail;
  req.currentUser = email ? users.get(email) || null : null;

  // Avoid serving stale logged-in pages if the in-memory demo store was reset.
  if (email && !req.currentUser) {
    req.session.userEmail = null;
  }
  next();
}

function requireLogin(req, res, next) {
  if (!req.currentUser) return res.status(401).json({ error: "Please log in to continue." });
  next();
}

module.exports = { attachCurrentUser, requireLogin };
