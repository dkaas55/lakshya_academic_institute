const StudentProfile = require("../models/StudentProfile");
const FeeLedger = require("../models/FeeLedger");
const { calculateDynamicAmountDue, deriveFeeStatus } = require("../utils/feeStatus");

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
      .populate("user", "name email")
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

    const dynamicAmountDue = calculateDynamicAmountDue(ledger, profile);
    const feeStatus = deriveFeeStatus(ledger, profile);

    res.json({
      success: true,
      data: {
        student: {
          id: profile._id,
          fullName: profile.user?.name ?? "Unknown",
          phoneNumber: profile.parentContact,
          batch: profile.batch,
        },
        ledger: {
          id: ledger._id,
          totalCourseFee: ledger.totalFee,
          amountPaid: ledger.amountPaid,
          amountDue: dynamicAmountDue,
          feeStatus,
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
  const { amount, paymentMode } = req.body;

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

    const dynamicAmountDue = calculateDynamicAmountDue(ledger, profile);
    if (paymentAmount > dynamicAmountDue) {
      return res.status(400).json({
        success: false,
        message: `Payment cannot exceed amount due (₹${dynamicAmountDue})`,
      });
    }

    ledger.amountPaid += paymentAmount;
    ledger.amountDue = Math.max(0, ledger.totalFee - ledger.amountPaid);
    ledger.paymentHistory.push({
      amount: paymentAmount,
      paidAt: new Date(),
      method: mode,
    });

    await ledger.save();

    const newDynamicAmountDue = calculateDynamicAmountDue(ledger, profile);
    const feeStatus = deriveFeeStatus(ledger, profile);

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
          amountPaid: ledger.amountPaid,
          amountDue: newDynamicAmountDue,
          feeStatus,
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

      const dynamicAmountDue = calculateDynamicAmountDue(ledger, ledger.student);
      if (dynamicAmountDue <= 0) continue;

      pendingList.push({
        id: ledger.student._id,
        studentName: ledger.student.user?.name || "Unknown",
        batch: ledger.student.batch,
        studentClass: ledger.student.studentClass,
        totalCourseFee: ledger.totalFee,
        amountPaid: ledger.amountPaid,
        amountDue: dynamicAmountDue,
        monthlyFeeAmount: ledger.monthlyFeeAmount || 0,
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

module.exports = { getLedger, collectInstallment, getAllTransactions, getPendingDues, PAYMENT_MODES };
