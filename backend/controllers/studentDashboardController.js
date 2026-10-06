const StudentProfile = require("../models/StudentProfile");
const FeeLedger = require("../models/FeeLedger");
const Content = require("../models/Content");
const Test = require("../models/Test");
const ExamResult = require("../models/ExamResult");
const Batch = require("../models/Batch");
const { getFeeOverview } = require("../utils/feeStatus");

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

    const studentBatches = Array.isArray(profile.batches) && profile.batches.length > 0
      ? profile.batches
      : (profile.batch ? profile.batch.split(",").map((b) => b.trim()).filter(Boolean) : []);

    // Fetch batch timing if batches are assigned
    let batchTiming = "";
    let batchTimingsList = [];
    if (studentBatches.length > 0) {
      const batchDocs = await Batch.find({ name: { $in: studentBatches } }).lean();
      batchTimingsList = studentBatches.map((bName) => {
        const found = batchDocs.find((d) => d.name === bName);
        return {
          name: bName,
          timing: found?.timing || "Regular Hours",
        };
      });
      const timingsWithBatch = batchDocs
        .filter((b) => b.timing)
        .map((b) => `${b.name}: ${b.timing}`);
      batchTiming = timingsWithBatch.join(" | ") || (batchDocs[0]?.timing || "");
    }

    // 2. Fetch the fee ledger for this profile
    const ledger = await FeeLedger.findOne({ student: profile._id }).lean();
    const overview = ledger ? getFeeOverview(ledger, profile) : null;

    const feeData = ledger && overview
      ? {
          totalCourseFee: ledger.totalFee,
          monthlyFeeAmount: overview.monthlyFeeAmount,
          amountPaid: ledger.amountPaid,
          amountDue: overview.amountDue,
          feeStatus: overview.feeStatus,
          feePendingForMonth: overview.feePendingForMonth,
          paymentTiming: overview.paymentTiming,
          previousPending: 0,
          paymentHistory: [...(ledger.paymentHistory ?? [])].sort(
            (a, b) => new Date(b.paidAt) - new Date(a.paidAt)
          ),
        }
      : null;

    // 3. Fetch study materials scoped to this student's batches
    const materials = await Content.find({ batch: { $in: studentBatches } })
      .sort({ createdAt: -1 })
      .lean();

    // 4. Fetch practice tests scoped to this student's batches
    const tests = await Test.find({ batch: { $in: studentBatches } })
      .sort({ createdAt: -1 })
      .lean();

    // 5. Fetch institute test results for this student
    const examConditions = [
      { "studentMarks.student": profile._id },
    ];
    if (profile.rollNo) {
      examConditions.push({ "studentMarks.studentRollNo": profile.rollNo });
    }
    if (studentBatches.length > 0) {
      examConditions.push({
        batch: { $in: studentBatches },
        ...(profile.studentClass ? { studentClass: { $in: [profile.studentClass, "", "All", "All Classes", null] } } : {}),
      });
    }

    const allExams = await ExamResult.find({ $or: examConditions })
      .sort({ examDate: -1, createdAt: -1 })
      .lean();

    const instituteExams = [];
    for (const exam of allExams) {
      // If exam is specified for a specific class, skip exams meant for a different class
      if (
        exam.studentClass &&
        profile.studentClass &&
        !["all", "all classes"].includes(exam.studentClass.trim().toLowerCase()) &&
        exam.studentClass.trim().toLowerCase() !== profile.studentClass.trim().toLowerCase()
      ) {
        continue;
      }

      // Strictly identify mark entry by student profile ID or unique roll number
      // (Never fall back to student name because different students can share the same name)
      const myMark = exam.studentMarks?.find(
        (sm) =>
          (sm.student && String(sm.student) === String(profile._id)) ||
          (profile.rollNo &&
            sm.studentRollNo &&
            sm.studentRollNo.trim().toUpperCase() === profile.rollNo.trim().toUpperCase())
      );

      if (myMark && (myMark.marksObtained !== null || myMark.isAbsent)) {
        instituteExams.push({
          id: exam._id,
          testName: exam.testName,
          subject: exam.subject,
          batch: exam.batch,
          studentClass: exam.studentClass,
          totalMarks: exam.totalMarks,
          examDate: exam.examDate,
          marksObtained: myMark.marksObtained,
          isAbsent: myMark.isAbsent,
        });
      }
    }

    // 6. Return the personalised dataset
    res.json({
      success: true,
      data: {
        student: {
          fullName: req.user.name,
          rollNo: profile.rollNo ?? "",
          batch: profile.batch || studentBatches.join(", "),
          batches: studentBatches,
          batchTiming: batchTiming,
          batchTimingsList: batchTimingsList,
          subjects: profile.subjects ?? "",
          studentClass: profile.studentClass ?? "",
          admissionDate: profile.admissionDate,
          joiningDate: profile.joiningDate ?? null,
          status: profile.status ?? "active",
        },
        fee: feeData,
        materials,
        tests,
        instituteExams,
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
