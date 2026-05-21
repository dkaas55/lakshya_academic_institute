const StudentProfile = require("../models/StudentProfile");
const Content = require("../models/Content");
const Test = require("../models/Test");

/**
 * GET /api/teacher/dashboard
 * Returns the logged-in teacher's profile, their assigned batches,
 * students enrolled in those batches, and materials/tests they have uploaded.
 */
const getTeacherDashboard = async (req, res) => {
  const teacher = req.user; // set by protect middleware

  try {
    const assignedBatches = teacher.assignedBatches || [];

    // ── Students in teacher's batches ──────────────────────────────────────
    let students = [];
    if (assignedBatches.length > 0) {
      const profiles = await StudentProfile.find({
        batch: { $in: assignedBatches },
        status: { $ne: "removed" }, // exclude removed students
      })
        .populate("user", "name email")
        .sort({ batch: 1, createdAt: -1 })
        .lean();

      students = profiles.map((p) => ({
        id: p._id,
        fullName: p.user?.name ?? "Unknown",
        batch: p.batch,
        studentClass: p.studentClass,
        subjects: p.subjects,
        joiningDate: p.joiningDate,
        status: p.status ?? "active",
      }));
    }

    // ── Materials uploaded by this teacher ─────────────────────────────────
    const myMaterials = await Content.find({ uploadedBy: teacher._id })
      .sort({ createdAt: -1 })
      .lean();

    // ── Tests uploaded by this teacher ──────────────────────────────────────
    const myTests = await Test.find({ uploadedBy: teacher._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          assignedBatches,
        },
        students,
        myMaterials,
        myTests,
      },
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load teacher dashboard",
    });
  }
};

module.exports = { getTeacherDashboard };
