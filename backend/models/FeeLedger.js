const mongoose = require("mongoose");

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const feeLedgerSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: [true, "Student reference is required"],
      unique: true,
    },
    totalFee: {
      type: Number,
      required: [true, "Total fee is required"],
      min: [0, "Total fee cannot be negative"],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    amountDue: {
      type: Number,
      required: [true, "Amount due is required"],
      min: [0, "Amount due cannot be negative"],
    },
    monthlyFeeAmount: {
      type: Number,
      default: 0,
      min: [0, "Monthly fee amount cannot be negative"],
    },
    lastBillingDate: {
      type: Date,
      default: Date.now,
    },
    paymentHistory: {
      type: [paymentEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeLedger", feeLedgerSchema);
