const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentProfile",
    required: [true, "Student reference is required"],
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late"],
    required: [true, "Attendance status is required"],
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Attendance date is required"],
    },
    batch: {
      type: String,
      required: [true, "Batch is required"],
      trim: true,
    },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness per batch per day
attendanceSchema.index({ date: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
