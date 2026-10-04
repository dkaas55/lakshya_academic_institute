const mongoose = require("mongoose");

const teacherSalaryPaymentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher reference is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [1, "Payment amount must be greater than 0"],
    },
    paymentType: {
      type: String,
      enum: {
        values: ["advance", "end"],
        message: "{VALUE} is not a valid payment timing (must be 'advance' or 'end')",
      },
      required: [true, "Payment timing (advance or end) is required"],
    },
    month: {
      type: String,
      required: [true, "Salary month is required"],
      trim: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"],
      default: "UPI",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeacherSalaryPayment", teacherSalaryPaymentSchema);
