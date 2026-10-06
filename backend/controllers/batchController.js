const Batch = require("../models/Batch");
const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const { syncBatchTeacherAssignments } = require("../utils/syncBatchTeachers");

// ── Helper: format batch before sending to client ─────────────────────────────
function formatBatch(batch) {
  const teachers = (batch.assignedTeachers || []).filter(
    (t) => t && (t._id || t.id || typeof t === "string")
  );
  return {
    id: batch._id,
    name: batch.name,
    subject: batch.subject || "",
    feePerStudent: batch.feePerStudent ?? 0,
    timing: batch.timing || "",
    assignedTeachers: teachers.map((t) => ({
      id: t._id || t.id || t,
      name: t.name || "",
      username: t.username || "",
      subject: t.subject || "",
    })),
    isActive: batch.isActive,
    createdAt: batch.createdAt,
  };
}

// ── GET /api/admin/batches ────────────────────────────────────────────────────
const getBatches = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  try {
    await syncBatchTeacherAssignments();

    const batches = await Batch.find()
      .populate("assignedTeachers", "name username subject")
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: { batches: batches.map(formatBatch) },
    });
  } catch (error) {
    console.error("getBatches error:", error);
    res.status(500).json({ success: false, message: "Failed to load batches" });
  }
};

// ── POST /api/admin/batches ───────────────────────────────────────────────────
const createBatch = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { name, subject, feePerStudent, timing, assignedTeachers } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Batch name is required",
    });
  }

  try {
    const duplicate = await Batch.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A batch with this name already exists",
      });
    }

    let batch = await Batch.create({
      name: name.trim(),
      subject: subject?.trim() || "",
      feePerStudent: feePerStudent != null ? Math.max(0, Number(feePerStudent)) : 0,
      timing: timing?.trim() || "",
      assignedTeachers: assignedTeachers || [],
    });

    // Two-way sync: Add batch name to assigned teachers
    if (assignedTeachers && assignedTeachers.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedTeachers }, role: "teacher" },
        { $addToSet: { assignedBatches: batch.name } }
      );
    }

    batch = await Batch.findById(batch._id)
      .populate("assignedTeachers", "name username subject")
      .lean();

    res.status(201).json({
      success: true,
      message: `Batch "${batch.name}" created successfully`,
      data: formatBatch(batch),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A batch with this name already exists",
      });
    }
    console.error("createBatch error:", error);
    res.status(500).json({ success: false, message: "Failed to create batch" });
  }
};

// ── PUT /api/admin/batches/:id ────────────────────────────────────────────────
const updateBatch = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { id } = req.params;
  const { name, subject, feePerStudent, timing, assignedTeachers } = req.body;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const oldName = batch.name;
    const newName = name?.trim() || oldName;

    if (name?.trim() && name.trim() !== batch.name) {
      const duplicate = await Batch.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "A batch with this name already exists",
        });
      }
      batch.name = newName;

      // Update references to old batch name in teachers and students
      await User.updateMany(
        { role: "teacher", assignedBatches: oldName },
        { $set: { "assignedBatches.$": newName } }
      );
      await StudentProfile.updateMany(
        { batch: oldName },
        { $set: { batch: newName } }
      );
    }

    if (subject !== undefined) batch.subject = subject?.trim() || "";
    if (feePerStudent !== undefined) {
      batch.feePerStudent = feePerStudent != null ? Math.max(0, Number(feePerStudent)) : 0;
    }
    if (timing !== undefined) batch.timing = timing?.trim() || "";

    if (assignedTeachers !== undefined) {
      batch.assignedTeachers = assignedTeachers;

      // 1. Add batch name to assigned teachers
      if (assignedTeachers.length > 0) {
        await User.updateMany(
          { _id: { $in: assignedTeachers }, role: "teacher" },
          { $addToSet: { assignedBatches: newName } }
        );
      }
      // 2. Remove batch name from teachers who are no longer assigned to this batch
      await User.updateMany(
        { _id: { $nin: assignedTeachers }, role: "teacher", assignedBatches: newName },
        { $pull: { assignedBatches: newName } }
      );
    }

    await batch.save();

    const populated = await Batch.findById(batch._id)
      .populate("assignedTeachers", "name username subject")
      .lean();

    res.json({
      success: true,
      message: "Batch updated successfully",
      data: formatBatch(populated),
    });
  } catch (error) {
    console.error("updateBatch error:", error);
    res.status(500).json({ success: false, message: "Failed to update batch" });
  }
};

// ── DELETE /api/admin/batches/:id ─────────────────────────────────────────────
const deleteBatch = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { id } = req.params;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    // Unassign students in this batch
    const studentRes = await StudentProfile.updateMany(
      { batch: batch.name },
      { $set: { batch: "" } }
    );

    // Unassign teachers from this batch
    const teacherRes = await User.updateMany(
      { role: "teacher" },
      { $pull: { assignedBatches: batch.name } }
    );

    await Batch.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Batch "${batch.name}" deleted successfully. Unassigned ${studentRes.modifiedCount} student(s) and updated teacher allocations.`,
    });
  } catch (error) {
    console.error("deleteBatch error:", error);
    res.status(500).json({ success: false, message: "Failed to delete batch" });
  }
};

// ── GET /api/batches (public – any authenticated role) ────────────────────────
const listActiveBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ isActive: true })
      .sort({ name: 1 })
      .select("name")
      .lean();

    res.json({
      success: true,
      data: { batches: batches.map((b) => b.name) },
    });
  } catch (error) {
    console.error("listActiveBatches error:", error);
    res.status(500).json({ success: false, message: "Failed to load batches" });
  }
};

module.exports = { getBatches, createBatch, updateBatch, deleteBatch, listActiveBatches };
