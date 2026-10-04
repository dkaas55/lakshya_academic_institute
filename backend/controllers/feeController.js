const StudentProfile = require("../models/StudentProfile");
const FeeLedger = require("../models/FeeLedger");
const {
  calculateDynamicAmountDue,
  deriveFeeStatus,
  calculateFeePendingForMonth,
  getFeeOverview,
  calculatePreviousPending,
} = require("../utils/feeStatus");

const PAYMENT_MODES = ["Cash", "UPI", "GPay", "PhonePe"];

const getLedger = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can view fee ledgers",
    });
  }

  const { studentId } = req.params;

  try {
    const profile = await StudentProfile.findById(studentId)
      .populate("user", "name username")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const ledger = await FeeLedger.findOne({ student: studentId }).lean();

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Fee ledger not found for this student",
      });
    }

    const overview = getFeeOverview(ledger, profile);

    res.json({
      success: true,
      data: {
        student: {
          id: profile._id,
          fullName: profile.user?.name ?? "Unknown",
          rollNo: profile.rollNo ?? "",
          phoneNumber: profile.parentContact,
          batch: profile.batch,
        },
        ledger: {
          id: ledger._id,
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
        },
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to load fee ledger",
    });
  }
};

const collectInstallment = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can collect fees",
    });
  }

  const { studentId } = req.params;
  const { amount, paymentMode, paymentTiming } = req.body;

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  const paymentAmount = Number(amount);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Payment amount must be a positive number",
    });
  }

  const mode = String(paymentMode ?? "").trim();
  if (!PAYMENT_MODES.includes(mode)) {
    return res.status(400).json({
      success: false,
      message: `Payment mode must be one of: ${PAYMENT_MODES.join(", ")}`,
    });
  }

  try {
    const profile = await StudentProfile.findById(studentId)
      .populate("user", "name")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const ledger = await FeeLedger.findOne({ student: studentId });

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Fee ledger not found for this student",
      });
    }

    // Set paymentTiming if provided or if not yet set
    if (paymentTiming && ["advance", "after_month"].includes(paymentTiming)) {
      ledger.paymentTiming = paymentTiming;
    } else if (!ledger.paymentTiming) {
      ledger.paymentTiming = "advance";
    }

    ledger.amountPaid += paymentAmount;
    if (ledger.amountPaid > ledger.totalFee) {
      ledger.totalFee = ledger.amountPaid;
    }
    ledger.amountDue = calculateDynamicAmountDue(ledger, profile);
    ledger.paymentHistory.push({
      amount: paymentAmount,
      paidAt: new Date(),
      method: mode,
    });

    await ledger.save();

    const overview = getFeeOverview(ledger, profile);

    res.json({
      success: true,
      message: "Installment recorded successfully",
      data: {
        student: {
          id: profile._id,
          fullName: profile.user?.name ?? "Unknown",
        },
        ledger: {
          totalCourseFee: ledger.totalFee,
          monthlyFeeAmount: overview.monthlyFeeAmount,
          amountPaid: ledger.amountPaid,
          amountDue: overview.amountDue,
          feeStatus: overview.feeStatus,
          feePendingForMonth: overview.feePendingForMonth,
          paymentTiming: overview.paymentTiming,
          previousPending: 0,
          paymentHistory: [...ledger.paymentHistory].sort(
            (a, b) => new Date(b.paidAt) - new Date(a.paidAt)
          ),
        },
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  }
};

const updatePaymentTiming = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can update payment timing",
    });
  }

  const { studentId } = req.params;
  const { paymentTiming } = req.body;

  if (!["advance", "after_month"].includes(paymentTiming)) {
    return res.status(400).json({
      success: false,
      message: "Payment timing must be 'advance' or 'after_month'",
    });
  }

  try {
    const profile = await StudentProfile.findById(studentId).lean();
    if (!profile) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const ledger = await FeeLedger.findOne({ student: studentId });
    if (!ledger) {
      return res.status(404).json({ success: false, message: "Fee ledger not found" });
    }

    ledger.paymentTiming = paymentTiming;
    ledger.amountDue = calculateDynamicAmountDue(ledger, profile);
    await ledger.save();

    const overview = getFeeOverview(ledger, profile);

    res.json({
      success: true,
      message: "Payment timing updated successfully",
      data: {
        ledger: {
          id: ledger._id,
          totalCourseFee: ledger.totalFee,
          monthlyFeeAmount: overview.monthlyFeeAmount,
          amountPaid: ledger.amountPaid,
          amountDue: overview.amountDue,
          feeStatus: overview.feeStatus,
          feePendingForMonth: overview.feePendingForMonth,
          paymentTiming: overview.paymentTiming,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update payment timing" });
  }
};

const getAllTransactions = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can view transactions",
    });
  }

  try {
    const ledgers = await FeeLedger.find()
      .populate({
        path: "student",
        populate: { path: "user", select: "name" },
      })
      .lean();

    const transactions = [];

    for (const ledger of ledgers) {
      if (!ledger.student || ledger.student.status === "removed") continue;

      for (const payment of ledger.paymentHistory || []) {
        transactions.push({
          id: payment._id,
          studentName: ledger.student.user?.name || "Unknown",
          rollNo: ledger.student.rollNo || "",
          batch: ledger.student.batch,
          amount: payment.amount,
          method: payment.method,
          paidAt: payment.paidAt,
        });
      }
    }

    transactions.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load transactions",
    });
  }
};

const getPendingDues = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can view pending dues",
    });
  }

  try {
    const ledgers = await FeeLedger.find()
      .populate({
        path: "student",
        populate: { path: "user", select: "name" },
      })
      .lean();

    const pendingList = [];

    for (const ledger of ledgers) {
      if (!ledger.student || ledger.student.status === "removed") continue;

      const overview = getFeeOverview(ledger, ledger.student);
      if (!overview || overview.amountDue <= 0) continue;

      pendingList.push({
        id: ledger.student._id,
        studentName: ledger.student.user?.name || "Unknown",
        rollNo: ledger.student.rollNo || "",
        batch: ledger.student.batch,
        studentClass: ledger.student.studentClass,
        totalCourseFee: ledger.totalFee,
        monthlyFeeAmount: overview.monthlyFeeAmount,
        amountPaid: ledger.amountPaid,
        amountDue: overview.amountDue,
        feeStatus: overview.feeStatus,
        feePendingForMonth: overview.feePendingForMonth,
        paymentTiming: overview.paymentTiming,
        lastBillingDate: ledger.lastBillingDate,
      });
    }

    res.json({
      success: true,
      data: pendingList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load pending dues",
    });
  }
};

module.exports = {
  getLedger,
  collectInstallment,
  updatePaymentTiming,
  getAllTransactions,
  getPendingDues,
  PAYMENT_MODES,
};
