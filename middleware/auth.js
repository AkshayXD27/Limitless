const { findUserByEmail } = require("../data/userStore");

async function attachCurrentUser(req, res, next) {
  try {
    const email = req.session && req.session.userEmail;
    if (!email) {
      req.currentUser = null;
      return next();
    }

    req.currentUser = await findUserByEmail(email);

    if (!req.currentUser) {
      req.session.userEmail = null;
    }
    next();
  } catch (err) {
    console.error("Error in attachCurrentUser:", err);
    req.currentUser = null;
    next();
  }
}

function requireLogin(req, res, next) {
  if (!req.currentUser) return res.status(401).json({ error: "Please log in to continue." });
  next();
}

module.exports = { attachCurrentUser, requireLogin };
