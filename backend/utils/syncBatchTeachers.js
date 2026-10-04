const User = require("../models/User");
const Batch = require("../models/Batch");

/**
 * Reconciles and synchronizes teacher assignments between:
 * - User model (user.assignedBatches: [String])
 * - Batch model (batch.assignedTeachers: [ObjectId])
 *
 * Cleans up dangling/deleted teacher references, invalid batch names,
 * and ensures bidirectional consistency.
 */
async function syncBatchTeacherAssignments() {
  try {
    const [batches, teachers] = await Promise.all([
      Batch.find(),
      User.find({ role: "teacher" }),
    ]);

    const activeBatchMap = new Map();
    for (const b of batches) {
      activeBatchMap.set(b.name, b);
    }

    const teacherMap = new Map();
    for (const t of teachers) {
      teacherMap.set(t._id.toString(), t);
    }

    // 1. Clean up teacher's assignedBatches (remove names of batches that do not exist)
    for (const teacher of teachers) {
      const currentBatches = teacher.assignedBatches || [];
      const validBatches = currentBatches.filter((name) => activeBatchMap.has(name));
      if (validBatches.length !== currentBatches.length) {
        teacher.assignedBatches = validBatches;
        await User.updateOne(
          { _id: teacher._id },
          { $set: { assignedBatches: validBatches } }
        );
      }
    }

    // 2. Build map of batchName -> Set of teacher IDs from teachers' assignedBatches
    const batchTeachersFromUser = new Map();
    for (const b of batches) {
      batchTeachersFromUser.set(b.name, new Set());
    }

    for (const teacher of teachers) {
      for (const batchName of teacher.assignedBatches || []) {
        if (batchTeachersFromUser.has(batchName)) {
          batchTeachersFromUser.get(batchName).add(teacher._id.toString());
        }
      }
    }

    // 3. For each batch, union current valid assignedTeachers with teachers who have this batch
    for (const batch of batches) {
      const teacherIdsFromTeacherDocs = batchTeachersFromUser.get(batch.name) || new Set();

      // Filter existing batch.assignedTeachers to only valid existing teacher IDs
      const validExistingTeachers = (batch.assignedTeachers || [])
        .map((id) => id?.toString())
        .filter((idStr) => idStr && teacherMap.has(idStr));

      // Union of both sources
      const allTeacherIds = Array.from(
        new Set([...validExistingTeachers, ...teacherIdsFromTeacherDocs])
      );

      // Check if batch.assignedTeachers changed
      const currentSet = new Set(
        (batch.assignedTeachers || []).map((id) => id?.toString()).filter(Boolean)
      );

      const hasChanged =
        currentSet.size !== allTeacherIds.length ||
        allTeacherIds.some((id) => !currentSet.has(id));

      if (hasChanged) {
        batch.assignedTeachers = allTeacherIds;
        await Batch.updateOne(
          { _id: batch._id },
          { $set: { assignedTeachers: allTeacherIds } }
        );
      }

      // Also ensure that all teachers in allTeacherIds have this batch in their assignedBatches
      for (const tId of allTeacherIds) {
        const teacherDoc = teacherMap.get(tId);
        if (teacherDoc && !(teacherDoc.assignedBatches || []).includes(batch.name)) {
          teacherDoc.assignedBatches = [...(teacherDoc.assignedBatches || []), batch.name];
          await User.updateOne(
            { _id: teacherDoc._id },
            { $addToSet: { assignedBatches: batch.name } }
          );
        }
      }
    }
  } catch (err) {
    console.error("Error in syncBatchTeacherAssignments:", err);
  }
}

module.exports = { syncBatchTeacherAssignments };
