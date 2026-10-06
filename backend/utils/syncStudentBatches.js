const StudentProfile = require("../models/StudentProfile");

/**
 * Ensures all existing student profiles have their `batches` array populated
 * from their legacy `batch` string field.
 */
const syncStudentBatches = async () => {
  try {
    const students = await StudentProfile.find({
      $or: [
        { batches: { $exists: false } },
        { batches: { $size: 0 } },
      ],
      batch: { $exists: true, $ne: "" },
    });

    if (!students.length) return;

    let migrated = 0;
    for (const s of students) {
      if (s.batch) {
        const split = s.batch
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean);
        if (split.length > 0) {
          s.batches = split;
          s.batch = split.join(", ");
          await s.save();
          migrated++;
        }
      }
    }

    if (migrated > 0) {
      console.log(`Synced batches array for ${migrated} student profile(s).`);
    }
  } catch (error) {
    console.error("Error in syncStudentBatches:", error.message);
  }
};

module.exports = { syncStudentBatches };
