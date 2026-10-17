const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Institute ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    parentPhone: {
      type: String,
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    classGrade: {
      type: String,
      trim: true,
      default: "",
    },
    batch: {
      type: String,
      trim: true,
      default: "General",
    },
    admissionFee: {
      type: Number,
      default: 0,
      min: [0, "Admission fee cannot be negative"],
    },
    pendingFee: {
      type: Number,
      default: 0,
      min: [0, "Pending fee cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "paused", "removed"],
        message: "{VALUE} is not a valid status",
      },
      default: "active",
    },
  },
  { timestamps: true }
);

// Compound indexes for fast lookups and institute isolation
studentSchema.index({ instituteId: 1, phone: 1 });
studentSchema.index({ instituteId: 1, rollNumber: 1 });
studentSchema.index({ instituteId: 1, parentPhone: 1 });

module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema);
