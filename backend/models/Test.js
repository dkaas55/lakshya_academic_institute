const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    testTitle: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    chapter: {
      type: String,
      trim: true,
      default: "",
    },
    totalQuestions: {
      type: Number,
      min: 1,
      default: null,
    },
    documentUrl: {
      type: String,
      required: true,
      trim: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
