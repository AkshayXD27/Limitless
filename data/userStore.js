const mongoose = require("mongoose");
const User = require("../models/User");

// In-memory fallback map for offline development when DB_PASSWORD is not set
const memoryUsers = new Map();

let dbConnected = false;

function buildMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  const dbPassword = process.env.DB_PASSWORD || process.env.MONGODB_PASSWORD;
  if (!dbPassword) {
    return null;
  }
  return `mongodb+srv://lostamongstars27_db_user:${encodeURIComponent(dbPassword)}@cluster0.wt9cw4f.mongodb.net/women_shealth?retryWrites=true&w=majority&appName=Cluster0`;
}

async function connectDatabase() {
  const uri = buildMongoUri();
  if (!uri) {
    console.warn("[MongoDB] Notice: DB_PASSWORD or MONGODB_URI is not set. Falling back to temporary in-memory store.");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    dbConnected = true;
    console.log("[MongoDB] Connected successfully to cluster0.wt9cw4f.mongodb.net/women_shealth");
    return true;
  } catch (err) {
    console.error("[MongoDB] Connection error:", err.message);
    console.warn("[MongoDB] Continuing with temporary in-memory store.");
    dbConnected = false;
    return false;
  }
}

function isDbConnected() {
  return dbConnected && mongoose.connection.readyState === 1;
}

async function findUserByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;

  if (isDbConnected()) {
    return await User.findOne({ email: normalized });
  }
  return memoryUsers.get(normalized) || null;
}

async function createUser({ name, email, passwordHash = null, firebaseUid = null, authProvider = "local", profile = null }) {
  const normalized = String(email || "").trim().toLowerCase();
  const trimmedName = String(name || "").trim();

  if (isDbConnected()) {
    return await User.create({
      name: trimmedName,
      email: normalized,
      passwordHash,
      firebaseUid,
      authProvider,
      profile
    });
  }

  const record = {
    name: trimmedName,
    email: normalized,
    passwordHash,
    firebaseUid,
    authProvider,
    profile
  };
  memoryUsers.set(normalized, record);
  return record;
}

async function updateUserProfile(email, profileData) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;

  if (isDbConnected()) {
    return await User.findOneAndUpdate(
      { email: normalized },
      { $set: { profile: profileData } },
      { new: true }
    );
  }

  const user = memoryUsers.get(normalized);
  if (user) {
    user.profile = profileData;
    memoryUsers.set(normalized, user);
  }
  return user || null;
}

async function syncFirebaseUser({ email, name, firebaseUid, authProvider = "firebase" }) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) throw new Error("Email is required for Firebase user synchronization.");

  if (isDbConnected()) {
    let user = await User.findOne({ email: normalized });
    if (user) {
      user.firebaseUid = firebaseUid || user.firebaseUid;
      if (!user.name && name) user.name = name.trim();
      if (authProvider) user.authProvider = authProvider;
      await user.save();
      return user;
    }

    return await User.create({
      name: (name || normalized.split("@")[0]).trim(),
      email: normalized,
      firebaseUid,
      authProvider,
      profile: null
    });
  }

  let user = memoryUsers.get(normalized);
  if (user) {
    user.firebaseUid = firebaseUid || user.firebaseUid;
    if (!user.name && name) user.name = name.trim();
    user.authProvider = authProvider;
  } else {
    user = {
      name: (name || normalized.split("@")[0]).trim(),
      email: normalized,
      passwordHash: null,
      firebaseUid,
      authProvider,
      profile: null
    };
    memoryUsers.set(normalized, user);
  }
  return user;
}

module.exports = {
  users: memoryUsers,
  connectDatabase,
  isDbConnected,
  findUserByEmail,
  createUser,
  updateUserProfile,
  syncFirebaseUser
};
