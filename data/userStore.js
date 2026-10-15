const { Pool } = require("pg");

// In-memory fallback map for offline development when no database is configured
const memoryUsers = new Map();

// Connection caching across serverless invocations
let cached = global.pgCached;
if (!cached) {
  cached = global.pgCached = { pool: null, initPromise: null, isConnected: false };
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (process.env.DATABASE_URL_UNPOOLED) {
    return process.env.DATABASE_URL_UNPOOLED;
  }
  // Check if MONGODB_URI was actually set to a PostgreSQL string
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith("postgres")) {
    return process.env.MONGODB_URI;
  }
  return null;
}

function getDbPool() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) return null;

  if (!cached.pool) {
    cached.pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  }
  return cached.pool;
}

async function initDatabaseTables(pool) {
  const schemaQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT,
      firebase_uid TEXT,
      auth_provider VARCHAR(50) DEFAULT 'local',
      profile JSONB DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

    CREATE TABLE IF NOT EXISTS community_posts (
      id SERIAL PRIMARY KEY,
      author VARCHAR(255) NOT NULL DEFAULT 'Community member',
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS community_reports (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
      reason TEXT,
      reported_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(schemaQuery);
}

async function connectDatabase() {
  const pool = getDbPool();
  if (!pool) {
    console.warn("[Neon Postgres] Notice: DATABASE_URL is not set. Falling back to temporary in-memory store.");
    cached.isConnected = false;
    return false;
  }

  if (cached.isConnected) {
    return true;
  }

  if (!cached.initPromise) {
    cached.initPromise = (async () => {
      const client = await pool.connect();
      try {
        await initDatabaseTables(pool);
        cached.isConnected = true;
        console.log("[Neon Postgres] Connected successfully to Neon Lakebase Postgres!");
        return true;
      } finally {
        client.release();
      }
    })().catch(err => {
      cached.initPromise = null;
      cached.isConnected = false;
      console.error("[Neon Postgres] Connection error:", err.message);
      return false;
    });
  }

  return await cached.initPromise;
}

async function ensureDb() {
  if (cached.isConnected) return true;
  return await connectDatabase();
}

function isDbConnected() {
  return cached.isConnected;
}

function normalizeUserRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash || row.password_hash,
    firebaseUid: row.firebaseUid || row.firebase_uid,
    authProvider: row.authProvider || row.auth_provider,
    profile: row.profile || null,
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at
  };
}

async function findUserByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;

  const connected = await ensureDb();
  if (connected) {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT id, name, email, password_hash AS "passwordHash",
              firebase_uid AS "firebaseUid", auth_provider AS "authProvider",
              profile, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalized]
    );
    return normalizeUserRecord(res.rows[0]);
  }

  return memoryUsers.get(normalized) || null;
}

async function createUser({ name, email, passwordHash = null, firebaseUid = null, authProvider = "local", profile = null }) {
  const normalized = String(email || "").trim().toLowerCase();
  const trimmedName = String(name || "").trim();

  const connected = await ensureDb();
  if (connected) {
    const pool = getDbPool();
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, firebase_uid, auth_provider, profile)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, password_hash AS "passwordHash",
                 firebase_uid AS "firebaseUid", auth_provider AS "authProvider",
                 profile, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [trimmedName, normalized, passwordHash, firebaseUid, authProvider, profile ? JSON.stringify(profile) : null]
    );
    return normalizeUserRecord(res.rows[0]);
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

  const connected = await ensureDb();
  if (connected) {
    const pool = getDbPool();
    const res = await pool.query(
      `UPDATE users
       SET profile = $1, updated_at = NOW()
       WHERE LOWER(email) = LOWER($2)
       RETURNING id, name, email, password_hash AS "passwordHash",
                 firebase_uid AS "firebaseUid", auth_provider AS "authProvider",
                 profile, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [JSON.stringify(profileData), normalized]
    );
    return normalizeUserRecord(res.rows[0]);
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

  const connected = await ensureDb();
  if (connected) {
    const pool = getDbPool();
    let existing = await findUserByEmail(normalized);
    if (existing) {
      const res = await pool.query(
        `UPDATE users
         SET firebase_uid = COALESCE($1, firebase_uid),
             name = CASE WHEN (name IS NULL OR name = '') AND $2 IS NOT NULL THEN $2 ELSE name END,
             auth_provider = COALESCE($3, auth_provider),
             updated_at = NOW()
         WHERE LOWER(email) = LOWER($4)
         RETURNING id, name, email, password_hash AS "passwordHash",
                   firebase_uid AS "firebaseUid", auth_provider AS "authProvider",
                   profile, created_at AS "createdAt", updated_at AS "updatedAt"`,
        [firebaseUid || null, name ? name.trim() : null, authProvider, normalized]
      );
      return normalizeUserRecord(res.rows[0]);
    }

    return await createUser({
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
  getDatabaseUrl,
  getDbPool,
  connectDatabase,
  ensureDb,
  isDbConnected,
  findUserByEmail,
  createUser,
  updateUserProfile,
  syncFirebaseUser
};
