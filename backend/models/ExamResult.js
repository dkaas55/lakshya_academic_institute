const mongoose = require("mongoose");

const studentMarkSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    studentName: { type: String, default: "" },
    studentRollNo: { type: String, default: "" },
    marksObtained: { type: Number, default: null },
    isAbsent: { type: Boolean, default: false },
  },
  { _id: false }
);

const examResultSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    studentClass: {
      type: String,
      trim: true,
      default: "",
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    examDate: {
      type: Date,
      default: Date.now,
    },
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentMarks: [studentMarkSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamResult", examResultSchema);
