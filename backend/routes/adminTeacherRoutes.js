const express = require("express");
const {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/adminTeacherController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require an authenticated admin (protect middleware + role check is
// done inside the controller for clear error messages)
router.get("/", protect, getTeachers);
router.post("/", protect, createTeacher);
router.put("/:id", protect, updateTeacher);
router.delete("/:id", protect, deleteTeacher);

module.exports = router;
