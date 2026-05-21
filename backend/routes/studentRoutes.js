const express = require("express");
const {
  registerStudent,
  getStudents,
  updateStudent,
  patchStudentStatus,
  getAdminStats,
} = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getStudents);
router.get("/stats", protect, getAdminStats);
router.post("/register", protect, registerStudent);
router.put("/:id", protect, updateStudent);
router.patch("/:id/status", protect, patchStudentStatus);

module.exports = router;
