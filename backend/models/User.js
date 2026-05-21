const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "teacher", "student"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
    },
    // For teachers: which batches they are assigned to teach
    assignedBatches: {
      type: [String],
      default: [],
    },
    // Teacher payroll & onboarding fields
    joiningDate: {
      type: Date,
      default: null,
    },
    compensationType: {
      type: String,
      enum: {
        values: ["fixed", "percentage"],
        message: "{VALUE} is not a valid compensation type",
      },
      default: null,
    },
    salaryAmount: {
      type: Number,
      default: null,
      min: [0, "Salary cannot be negative"],
    },
    fixedSalary: {
      type: Number,
      default: 0,
      min: [0, "Salary cannot be negative"],
    },
    studentPercentage: {
      type: Number,
      default: null,
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
    },
    salaryPercentage: {
      type: Number,
      default: 0,
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
