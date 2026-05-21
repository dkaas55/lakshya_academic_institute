/**
 * seed-batch-material.js
 *
 * Validation script for Module C batch filtering.
 *
 * What it does:
 *   1. Finds Rohit Kumar's StudentProfile to confirm his current batch.
 *   2. Finds the first Content document in the DB (e.g. "Basic Operation").
 *   3. Duplicates it, tagging the copy for 'Morning Batch B'.
 *   4. Prints a summary so you can verify the student portal will display it.
 *
 * Run from: d:\institute_app\backend
 *   node ../seed-batch-material.js
 *
 * To undo: log into MongoDB Atlas and delete the document whose title
 * starts with "[Batch B Copy]", or run this script's cleanup section.
 */

require("dotenv").config();
const mongoose = require("mongoose");

// ── Inline mini-schemas (avoids circular require issues) ─────────────────────
const User = require("./models/User");
const StudentProfile = require("./models/StudentProfile");
const Content = require("./models/Content");

const TARGET_BATCH = "Morning Batch B";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌  MONGODB_URI not set in .env");
    process.exit(1);
  }

  console.log("⏳  Connecting to MongoDB…");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("✅  Connected\n");

  // ── 1. Find Rohit Kumar ───────────────────────────────────────────────────
  const rohitUser = await User.findOne({ name: /rohit/i }).lean();

  if (!rohitUser) {
    console.warn("⚠️   No user matching 'Rohit' found in Users collection.");
  } else {
    const profile = await StudentProfile.findOne({ user: rohitUser._id }).lean();
    if (profile) {
      console.log("👤  Rohit Kumar profile found:");
      console.log(`    Name  : ${rohitUser.name}`);
      console.log(`    Batch : ${profile.batch}`);
      console.log(`    ID    : ${profile._id}\n`);

      if (profile.batch !== TARGET_BATCH) {
        console.log(
          `ℹ️   His batch is '${profile.batch}', not '${TARGET_BATCH}'.\n` +
          `    We will seed a Content item tagged '${TARGET_BATCH}'\n` +
          `    so the portal shows it when his batch matches.\n`
        );
      } else {
        console.log(`✅  Batch already matches '${TARGET_BATCH}'.\n`);
      }
    }
  }

  // ── 2. Find first existing Content document to clone ─────────────────────
  const sourceDoc = await Content.findOne().lean();

  if (!sourceDoc) {
    console.error(
      "❌  No Content documents found in the DB.\n" +
      "    Please upload at least one study material via the Admin\n" +
      "    Content Manager first, then re-run this script."
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`📄  Source document found: "${sourceDoc.title}" (batch: ${sourceDoc.batch})`);

  // ── 3. Check if the copy already exists (idempotent) ─────────────────────
  const copyTitle = `[Batch B Copy] ${sourceDoc.title}`;
  const existing = await Content.findOne({ title: copyTitle, batch: TARGET_BATCH }).lean();

  if (existing) {
    console.log(`\n⚡  Copy already exists: "${copyTitle}" for batch '${TARGET_BATCH}'.`);
    console.log("    No duplicate created. Re-run the student portal to verify the card shows.\n");
    await mongoose.disconnect();
    return;
  }

  // ── 4. Create the duplicate tagged for Morning Batch B ────────────────────
  const { _id, createdAt, updatedAt, __v, ...rest } = sourceDoc;

  const newDoc = await Content.create({
    ...rest,
    title: copyTitle,
    batch: TARGET_BATCH,
    description:
      `[Seeded for batch validation] ${sourceDoc.description || ""}`.trim(),
  });

  console.log(`\n✅  Seeded new Content document:`);
  console.log(`    ID      : ${newDoc._id}`);
  console.log(`    Title   : ${newDoc.title}`);
  console.log(`    Batch   : ${newDoc.batch}`);
  console.log(`    Subject : ${newDoc.subject}`);
  console.log(`    Type    : ${newDoc.materialType}`);
  console.log(`    Link    : ${newDoc.fileUrlOrLink}\n`);

  console.log("🏁  Done. Next steps:");
  console.log("    1. Open the Student Portal in the browser and sign in as Rohit Kumar.");
  console.log(`    2. If his batch is '${TARGET_BATCH}', the new card should appear immediately.`);
  console.log(`    3. If his batch is different, switch it to '${TARGET_BATCH}' via the`);
  console.log("       Admin → Student Registration → Edit modal, then refresh the portal.\n");

  await mongoose.disconnect();
  console.log("🔌  Disconnected from MongoDB.");
}

run().catch((err) => {
  console.error("❌  Script failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
