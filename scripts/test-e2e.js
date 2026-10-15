const http = require("http");
const fs = require("fs");
const path = require("path");

if (fs.existsSync(path.join(__dirname, "..", ".env.local"))) {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
}
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

process.env.PORT = "3456";
process.env.NODE_ENV = "test";

const app = require("../app");
const { getDbPool } = require("../data/userStore");

function request(options, data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const headers = { ...options.headers };
    if (cookie) headers["Cookie"] = cookie;
    if (data && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

    const req = http.request({ ...options, headers }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        const setCookie = res.headers["set-cookie"];
        resolve({ status: res.statusCode, headers: res.headers, body, json, setCookie });
      });
    });
    req.on("error", reject);
    if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("   Sakhi Health Neon End-to-End Tests     ");
  console.log("==========================================\n");

  const server = app.listen(3456);
  await new Promise(r => setTimeout(r, 2000));

  let cookie = null;
  const testEmail = `neon_test_${Date.now()}@example.com`;

  try {
    // 1. Health check
    console.log("1. Testing GET /api/health...");
    const health = await request({ hostname: "localhost", port: 3456, path: "/api/health", method: "GET" });
    console.log("   Status:", health.status);
    console.log("   Database Provider:", health.json?.database?.provider);
    console.log("   Database Connected:", health.json?.database?.connected);
    if (!health.json?.database?.connected) throw new Error("Health check failed: DB not connected");

    // 2. User registration
    console.log("\n2. Testing POST /api/auth/register (saves user to Neon Postgres)...");
    const reg = await request(
      { hostname: "localhost", port: 3456, path: "/api/auth/register", method: "POST" },
      { name: "Neon Tester", email: testEmail, password: "SecurePassword123!" }
    );
    console.log("   Status:", reg.status);
    console.log("   Response:", reg.json);
    if (reg.status !== 200) throw new Error("User registration failed: " + reg.body);
    if (reg.setCookie) cookie = reg.setCookie[0].split(";")[0];

    // 3. User Login
    console.log("\n3. Testing POST /api/auth/login (authenticates against Neon Postgres)...");
    const login = await request(
      { hostname: "localhost", port: 3456, path: "/api/auth/login", method: "POST" },
      { email: testEmail, password: "SecurePassword123!" }
    );
    console.log("   Status:", login.status);
    console.log("   Response:", login.json);
    if (login.status !== 200) throw new Error("Login failed: " + login.body);
    if (login.setCookie) cookie = login.setCookie[0].split(";")[0];

    // 4. Update Profile
    console.log("\n4. Testing POST /api/profile (saves JSONB profile to Neon Postgres)...");
    const profile = await request(
      { hostname: "localhost", port: 3456, path: "/api/profile", method: "POST" },
      {
        age: 26,
        height: 165,
        weight: 60,
        language: "English",
        medicalHistory: "None",
        symptoms: "Mild cramps"
      },
      cookie
    );
    console.log("   Status:", profile.status);
    console.log("   Response:", profile.json);
    if (profile.status !== 200) throw new Error("Profile update failed: " + profile.body);

    // 5. Test Dashboard access with session
    console.log("\n5. Testing GET /dashboard (verifies session & profile retrieval from Neon)...");
    const dashboard = await request(
      { hostname: "localhost", port: 3456, path: "/dashboard", method: "GET" },
      null,
      cookie
    );
    console.log("   Status:", dashboard.status);
    if (dashboard.status !== 200 || !dashboard.body.includes("Neon Tester")) {
      throw new Error("Dashboard render failed with session");
    }
    console.log("   Dashboard rendered successfully for user 'Neon Tester'!");

    // 6. Community Post
    console.log("\n6. Testing POST /api/community (persists post to Neon community_posts)...");
    const postRes = await request(
      { hostname: "localhost", port: 3456, path: "/api/community", method: "POST" },
      { content: "Hello Neon Postgres from automated test!" }
    );
    console.log("   Status:", postRes.status);
    console.log("   Created Post:", postRes.json?.post);
    if (postRes.status !== 201) throw new Error("Community post failed");

    // 7. Community Fetch
    console.log("\n7. Testing GET /api/community (reads posts from Neon Postgres)...");
    const getPosts = await request({ hostname: "localhost", port: 3456, path: "/api/community", method: "GET" });
    console.log("   Status:", getPosts.status);
    console.log("   Fetched Post count:", getPosts.json?.posts?.length);

    // 8. Symptom guidance
    console.log("\n8. Testing POST /api/symptoms/guidance (tests guidance route)...");
    const guidance = await request(
      { hostname: "localhost", port: 3456, path: "/api/symptoms/guidance", method: "POST" },
      { description: "I have irregular periods and acne" },
      cookie
    );
    console.log("   Status:", guidance.status);
    console.log("   Guidance Title:", guidance.json?.result?.title);
    if (guidance.status !== 200) throw new Error("Guidance endpoint failed");

    // 9. Inspect Neon DB tables
    console.log("\n9. Verifying live rows in Neon PostgreSQL...");
    const pool = getDbPool();
    const userCount = await pool.query("SELECT COUNT(*) FROM users");
    const sessionCount = await pool.query("SELECT COUNT(*) FROM session");
    const postCount = await pool.query("SELECT COUNT(*) FROM community_posts");
    console.log("   Users count in Neon:         ", userCount.rows[0].count);
    console.log("   Sessions count in Neon:      ", sessionCount.rows[0].count);
    console.log("   Community posts in Neon:     ", postCount.rows[0].count);

    console.log("\n🎉 ALL SERVICES TESTED AND PASSING END-TO-END ON NEON!");
  } finally {
    server.close();
    const pool = getDbPool();
    if (pool) await pool.end();
  }
}

runTests().catch(err => {
  console.error("\n❌ E2E Test Failure:", err);
  process.exit(1);
});
