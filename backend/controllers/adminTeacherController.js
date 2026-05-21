const bcrypt = require("bcryptjs");
const User = require("../models/User");

const SALT_ROUNDS = 12;
const BATCH_OPTIONS = [
  "Morning Batch A",
  "Morning Batch B",
  "Evening Batch A",
  "Evening Batch B",
  "Weekend Batch",
];

// ── Helper: strip sensitive fields before sending to client ───────────────────
function formatTeacher(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    assignedBatches: user.assignedBatches ?? [],
    joiningDate: user.joiningDate,
    compensationType: user.compensationType,
    salaryAmount: user.salaryAmount,
    fixedSalary: user.fixedSalary ?? user.salaryAmount ?? 0,
    studentPercentage: user.studentPercentage,
    salaryPercentage: user.salaryPercentage ?? user.studentPercentage ?? 0,
    createdAt: user.createdAt,
  };
}

// ── GET /api/admin/teachers ───────────────────────────────────────────────────
const getTeachers = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  try {
    const teachers = await User.find({ role: "teacher" })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { teachers: teachers.map(formatTeacher) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load teachers" });
  }
};

// ── POST /api/admin/teachers ──────────────────────────────────────────────────
const createTeacher = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const {
    name,
    email,
    password,
    assignedBatches = [],
    joiningDate,
    compensationType,
    salaryAmount,
    studentPercentage,
  } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  if (compensationType && !["fixed", "percentage"].includes(compensationType)) {
    return res.status(400).json({
      success: false,
      message: "Compensation type must be 'fixed' or 'percentage'",
    });
  }

  const invalidBatches = (assignedBatches || []).filter(
    (b) => !BATCH_OPTIONS.includes(b)
  );
  if (invalidBatches.length) {
    return res.status(400).json({
      success: false,
      message: `Invalid batch(es): ${invalidBatches.join(", ")}`,
    });
  }

  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    const teacher = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "teacher",
      assignedBatches: assignedBatches ?? [],
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      compensationType: compensationType || null,
      salaryAmount: salaryAmount != null ? Number(salaryAmount) : null,
      fixedSalary: salaryAmount != null ? Number(salaryAmount) : 0,
      studentPercentage:
        studentPercentage != null ? Number(studentPercentage) : null,
      salaryPercentage:
        studentPercentage != null ? Number(studentPercentage) : 0,
    });

    res.status(201).json({
      success: true,
      message: `Teacher "${teacher.name}" onboarded successfully`,
      data: formatTeacher(teacher),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
    console.error("createTeacher error:", error);
    res.status(500).json({ success: false, message: "Failed to create teacher" });
  }
};

// ── PUT /api/admin/teachers/:id ───────────────────────────────────────────────
const updateTeacher = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { id } = req.params;
  const {
    name,
    assignedBatches,
    joiningDate,
    compensationType,
    salaryAmount,
    studentPercentage,
  } = req.body;

  if (
    compensationType !== undefined &&
    compensationType !== null &&
    !["fixed", "percentage"].includes(compensationType)
  ) {
    return res.status(400).json({
      success: false,
      message: "Compensation type must be 'fixed' or 'percentage'",
    });
  }

  if (assignedBatches !== undefined) {
    const invalidBatches = assignedBatches.filter(
      (b) => !BATCH_OPTIONS.includes(b)
    );
    if (invalidBatches.length) {
      return res.status(400).json({
        success: false,
        message: `Invalid batch(es): ${invalidBatches.join(", ")}`,
      });
    }
  }

  try {
    const teacher = await User.findOne({ _id: id, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (name?.trim()) teacher.name = name.trim();
    if (assignedBatches !== undefined) teacher.assignedBatches = assignedBatches;
    if (joiningDate !== undefined)
      teacher.joiningDate = joiningDate ? new Date(joiningDate) : null;
    if (compensationType !== undefined) teacher.compensationType = compensationType;
    if (salaryAmount !== undefined) {
      teacher.salaryAmount = salaryAmount != null ? Number(salaryAmount) : null;
      teacher.fixedSalary = salaryAmount != null ? Number(salaryAmount) : 0;
    }
    if (studentPercentage !== undefined) {
      teacher.studentPercentage =
        studentPercentage != null ? Number(studentPercentage) : null;
      teacher.salaryPercentage =
        studentPercentage != null ? Number(studentPercentage) : 0;
    }

    await teacher.save();

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: formatTeacher(teacher),
    });
  } catch (error) {
    console.error("updateTeacher error:", error);
    res.status(500).json({ success: false, message: "Failed to update teacher" });
  }
};

// ── DELETE /api/admin/teachers/:id ────────────────────────────────────────────
const deleteTeacher = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  const { id } = req.params;

  try {
    const teacher = await User.findOneAndDelete({ _id: id, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.json({
      success: true,
      message: `Teacher "${teacher.name}" removed successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete teacher" });
  }
};

module.exports = { getTeachers, createTeacher, updateTeacher, deleteTeacher };
