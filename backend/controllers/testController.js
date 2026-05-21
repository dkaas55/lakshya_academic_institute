const Test = require("../models/Test");

// ── GET /api/tests ────────────────────────────────────────────────────────────
const getTests = async (req, res) => {
  try {
    const { batch } = req.query;
    const { role } = req.user;
    const assignedBatches = req.user.assignedBatches || [];

    let query = {};

    if (batch) {
      query.batch = batch;
    }

    // Teachers can only see tests for their assigned batches
    if (role === "teacher") {
      if (batch && !assignedBatches.includes(batch)) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this batch.",
        });
      }
      if (!batch) {
        query.batch = { $in: assignedBatches };
      }
    }

    const tests = await Test.find(query)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name");

    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load practice tests." });
  }
};

// ── POST /api/tests ───────────────────────────────────────────────────────────
const createTest = async (req, res) => {
  const { role } = req.user;
  const assignedBatches = req.user.assignedBatches || [];

  if (role !== "admin" && role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only administrators or teachers can upload tests.",
    });
  }

  const { testTitle, subject, chapter, totalQuestions, documentUrl, batch } = req.body;

  if (!testTitle || !subject || !documentUrl || !batch) {
    return res.status(400).json({
      success: false,
      message: "Test title, subject, document URL, and batch are required.",
    });
  }

  if (role === "teacher" && !assignedBatches.includes(batch.trim())) {
    return res.status(403).json({
      success: false,
      message: `You are not assigned to batch "${batch}".`,
    });
  }

  try {
    const newTest = await Test.create({
      testTitle: testTitle.trim(),
      subject: subject.trim(),
      chapter: chapter?.trim() || "",
      totalQuestions: totalQuestions ? Number(totalQuestions) : null,
      documentUrl: documentUrl.trim(),
      batch: batch.trim(),
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Practice test uploaded successfully.",
      data: newTest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to upload practice test." });
  }
};

// ── DELETE /api/tests/:id ─────────────────────────────────────────────────────
const deleteTest = async (req, res) => {
  const { role, _id: userId } = req.user;

  if (role !== "admin" && role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only administrators or teachers can delete tests.",
    });
  }

  const { id } = req.params;

  try {
    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: "Practice test not found." });
    }

    if (role === "teacher" && String(test.uploadedBy) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete tests that you uploaded.",
      });
    }

    await Test.deleteOne({ _id: id });
    res.json({ success: true, message: "Practice test deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete practice test." });
  }
};

module.exports = { getTests, createTest, deleteTest };
