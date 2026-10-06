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
        $or: [
          { batches: { $in: assignedBatches } },
          { batch: { $in: assignedBatches } },
        ],
        status: { $ne: "removed" }, // exclude removed students
      })
        .populate("user", "name username")
        .sort({ batch: 1, createdAt: -1 })
        .lean();

      students = profiles.map((p) => {
        const sBatches = Array.isArray(p.batches) && p.batches.length > 0
          ? p.batches
          : (p.batch ? p.batch.split(",").map((b) => b.trim()).filter(Boolean) : []);

        return {
          id: p._id,
          fullName: p.user?.name ?? "Unknown",
          rollNo: p.rollNo ?? "",
          batch: p.batch || sBatches.join(", "),
          batches: sBatches,
          studentClass: p.studentClass,
          subjects: p.subjects,
          joiningDate: p.joiningDate,
          status: p.status ?? "active",
        };
      });
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
          username: teacher.username,
          subject: teacher.subject || "",
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
