/**
 * seed-teacher.js
 *
 * Creates a demo Teacher account in MongoDB for testing the Teacher Portal.
 * Run from: d:\institute_app\backend
 *   node seed-teacher.js
 *
 * Credentials created:
 *   Email   : teacher@institute.com
 *   Password: Teacher@123
 *   Batches : Morning Batch A, Morning Batch B
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("❌  MONGODB_URI not set"); process.exit(1); }

  console.log("⏳  Connecting to MongoDB…");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("✅  Connected\n");

  const existing = await User.findOne({ email: "teacher@institute.com" });
  if (existing) {
    console.log("ℹ️   Teacher account already exists:");
    console.log(`    Email   : ${existing.email}`);
    console.log(`    Batches : ${existing.assignedBatches.join(", ")}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash("Teacher@123", 12);

  const teacher = await User.create({
    name: "Priya Sharma",
    email: "teacher@institute.com",
    passwordHash,
    role: "teacher",
    assignedBatches: ["Morning Batch A", "Morning Batch B"],
  });

  console.log("✅  Teacher account created:");
  console.log(`    Name    : ${teacher.name}`);
  console.log(`    Email   : ${teacher.email}`);
  console.log(`    Password: Teacher@123`);
  console.log(`    Batches : ${teacher.assignedBatches.join(", ")}`);
  console.log("\n🏁  Sign in at http://localhost:5173/login with role = Teacher");

  await mongoose.disconnect();
  console.log("🔌  Disconnected.");
}

run().catch((err) => {
  console.error("❌  Script failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
