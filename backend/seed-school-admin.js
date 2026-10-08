/**
 * seed-school-admin.js
 *
 * Script to onboard a new school or institute by creating its Master Admin account.
 *
 * Usage:
 *   node seed-school-admin.js --username=schooladmin --password=YourPassword123 --name="Apex Academy"
 *
 * Optional: pass custom MONGODB_URI directly:
 *   node seed-school-admin.js --uri="mongodb+srv://.../school_apex" --username=apex_admin --password=SecretPassword
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const getArg = (key, fallback = null) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${key}=`));
  return match ? match.split("=").slice(1).join("=") : fallback;
};

async function seedSchoolAdmin() {
  const uri = getArg("uri", process.env.MONGODB_URI);
  const username = getArg("username", "admin").toLowerCase().trim();
  const password = getArg("password", "password123");
  const name = getArg("name", "School Administrator");

  if (!uri) {
    console.error("❌ MONGODB_URI is not provided via --uri= or .env");
    process.exit(1);
  }

  console.log(`⏳ Connecting to database: ${uri.split("@").pop()}...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log("✅ Database connected.\n");

  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`⚠️  An account with username "${username}" already exists.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    username,
    passwordHash,
    role: "admin",
  });

  console.log("🎉 New Master Admin successfully created!");
  console.log(`   Institute Admin Name : ${user.name}`);
  console.log(`   Username             : ${user.username}`);
  console.log(`   Password             : ${password}`);
  console.log(`   Role                 : ${user.role}`);
  console.log("\n👉 Share these credentials with the school head/principal.");

  await mongoose.disconnect();
  console.log("🔌 Database disconnected cleanly.");
}

seedSchoolAdmin().catch((err) => {
  console.error("❌ Failed to seed school admin:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
