const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const FeeLedger = require("../models/FeeLedger");

/**
 * Calculates a teacher's projected salary for the current month.
 * If compensationType is 'fixed', returns the fixedSalary/salaryAmount.
 * If 'percentage', sums the monthly fees of all non-removed students in the teacher's assigned batches
 * and multiplies by the teacher's salaryPercentage.
 */
const calculateTeacherSalary = async (teacherId) => {
  const teacher = await User.findById(teacherId).lean();
  if (!teacher || teacher.role !== "teacher") return 0;

  if (teacher.compensationType === "fixed") {
    return teacher.fixedSalary ?? teacher.salaryAmount ?? 0;
  }

  if (teacher.compensationType === "percentage") {
    // Find all active/paused students in the batches assigned to this teacher
    const students = await StudentProfile.find({
      batch: { $in: teacher.assignedBatches || [] },
      status: { $ne: "removed" },
    }).lean();

    const studentIds = students.map((s) => s._id);
    const ledgers = await FeeLedger.find({ student: { $in: studentIds } }).lean();

    const totalMonthlyFee = ledgers.reduce((sum, ledger) => {
      return sum + (ledger.monthlyFeeAmount || ledger.totalFee || 0);
    }, 0);

    const percentage = teacher.salaryPercentage ?? teacher.studentPercentage ?? 0;
    return totalMonthlyFee * (percentage / 100);
  }

  // Fallback: default to fixed salary if compensationType is unset/null
  return teacher.fixedSalary ?? teacher.salaryAmount ?? 0;
};

const getSalaryOverview = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const teacher = await User.findById(teacherId).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const salary = await calculateTeacherSalary(teacherId);

    res.json({
      success: true,
      data: {
        salary,
        compensationType: teacher.compensationType || "fixed",
        fixedSalary: teacher.fixedSalary ?? teacher.salaryAmount ?? 0,
        salaryPercentage: teacher.salaryPercentage ?? teacher.studentPercentage ?? 0,
      },
    });
  } catch (error) {
    console.error("Error in getSalaryOverview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate salary overview",
    });
  }
};

module.exports = { calculateTeacherSalary, getSalaryOverview };
