const express = require("express");
const {
  getExamResults,
  createExamResult,
  saveExamMarks,
  deleteExamResult,
  getStudentsByBatch,
} = require("../controllers/examResultController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/students", protect, getStudentsByBatch);
router.get("/", protect, getExamResults);
router.post("/", protect, createExamResult);
router.patch("/:id/marks", protect, saveExamMarks);
router.delete("/:id", protect, deleteExamResult);

module.exports = router;
