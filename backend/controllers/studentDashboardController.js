const StudentProfile = require("../models/StudentProfile");
const FeeLedger = require("../models/FeeLedger");
const Content = require("../models/Content");
const Test = require("../models/Test");
const { calculateDynamicAmountDue, deriveFeeStatus } = require("../utils/feeStatus");

const getStudentDashboard = async (req, res) => {
  // Any authenticated user who is a student can access their own dashboard
  if (req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "This endpoint is for students only",
    });
  }

  try {
    // 1. Find the student's profile using their User _id from the JWT
    const profile = await StudentProfile.findOne({ user: req.user._id }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found. Please contact your administrator.",
      });
    }

    // 2. Fetch the fee ledger for this profile
    const ledger = await FeeLedger.findOne({ student: profile._id }).lean();

    const feeStatus = deriveFeeStatus(ledger, profile);

    const feeData = ledger
      ? {
          totalCourseFee: ledger.totalFee,
          amountPaid: ledger.amountPaid,
          amountDue: calculateDynamicAmountDue(ledger, profile),
          feeStatus,
          paymentHistory: [...(ledger.paymentHistory ?? [])].sort(
            (a, b) => new Date(b.paidAt) - new Date(a.paidAt)
          ),
        }
      : null;

    // 3. Fetch study materials scoped to this student's batch
    const materials = await Content.find({ batch: profile.batch })
      .sort({ createdAt: -1 })
      .lean();

    // 4. Fetch practice tests scoped to this student's batch
    const tests = await Test.find({ batch: profile.batch })
      .sort({ createdAt: -1 })
      .lean();

    // 5. Return the personalised dataset
    res.json({
      success: true,
      data: {
        student: {
          fullName: req.user.name,
          batch: profile.batch,
          admissionDate: profile.admissionDate,
          joiningDate: profile.joiningDate ?? null,
          status: profile.status ?? "active",
        },
        fee: feeData,
        materials,
        tests,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load your dashboard. Please try again.",
    });
  }
};

module.exports = { getStudentDashboard };
