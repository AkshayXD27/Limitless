require("dotenv").config();
const mongoose = require("mongoose");

async function checkConnection() {
  const dbPassword = process.env.DB_PASSWORD || process.env.MONGODB_PASSWORD;
  const uri = process.env.MONGODB_URI || (dbPassword
    ? `mongodb+srv://lostamongstars27_db_user:${encodeURIComponent(dbPassword)}@cluster0.wt9cw4f.mongodb.net/women_shealth?retryWrites=true&w=majority&appName=Cluster0`
    : null);

  if (!uri) {
    console.log("\n❌ Status: DB_PASSWORD (or MONGODB_URI) is NOT set.");
    console.log("👉 To test locally, create a .env file with:");
    console.log("   DB_PASSWORD=your_actual_password_here\n");
    process.exit(1);
  }

  console.log("\n🔄 Attempting connection to MongoDB cluster...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
    console.log("✅ SUCCESS: Successfully connected to MongoDB Atlas!");
    console.log("   Host:", mongoose.connection.host);
    console.log("   Database name:", mongoose.connection.name);
    console.log("   Ready state: Connected (1)\n");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ FAILED: Unable to connect to MongoDB Atlas.");
    console.error("   Error details:", err.message);
    console.log("   Common causes:");
    console.log("   1. Incorrect DB_PASSWORD");
    console.log("   2. IP access list in MongoDB Atlas does not include 0.0.0.0/0 (Network Access > Add IP Address)\n");
    process.exit(1);
  }
}

checkConnection();
