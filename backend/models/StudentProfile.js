const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    batch: {
      type: String,
      trim: true,
      default: "",
    },
    studentClass: {
      type: String,
      trim: true,
    },
    subjects: {
      type: String,
      trim: true,
    },
    parentContact: {
      type: String,
      required: [true, "Parent contact is required"],
      trim: true,
    },
    admissionDate: {
      type: Date,
      required: [true, "Admission date is required"],
    },
    joiningDate: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model("StudentProfile", studentProfileSchema);

