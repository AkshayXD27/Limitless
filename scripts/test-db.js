const fs = require("fs");
const path = require("path");

if (fs.existsSync(path.join(__dirname, "..", ".env.local"))) {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
}
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Pool } = require("pg");

async function checkConnection() {
  const uri = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

  if (!uri) {
    console.log("\n❌ Status: DATABASE_URL is NOT set.");
    console.log("👉 Run `neon deploy` or `neon env pull` to pull Neon credentials.\n");
    process.exit(1);
  }

  console.log("\n🔄 Attempting connection to Neon PostgreSQL...");
  const pool = new Pool({
    connectionString: uri,
    ssl: { rejectUnauthorized: false }
  });

  const startTime = Date.now();
  try {
    const res = await pool.query(`
      SELECT NOW() as current_time,
             current_database() as db_name,
             current_user as db_user,
             version() as pg_version
    `);
    const latency = Date.now() - startTime;

    console.log("✅ SUCCESS: Successfully connected to Neon Lakebase Postgres!");
    console.log("   Database:", res.rows[0].db_name);
    console.log("   User:    ", res.rows[0].db_user);
    console.log("   Version: ", res.rows[0].pg_version.split("\n")[0]);
    console.log("   Latency: ", `${latency}ms`);

    // Check tables
    const tableRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    console.log("   Tables:  ", tables.length ? tables.join(", ") : "(no tables created yet)");
    console.log();

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ FAILED: Unable to connect to Neon PostgreSQL.");
    console.error("   Error details:", err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

checkConnection();
