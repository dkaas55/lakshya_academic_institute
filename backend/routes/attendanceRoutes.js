const express = require("express");
const {
  getAttendanceSheet,
  saveAttendanceSheet,
  updateAttendanceSheet,
  getMyAttendanceHistory,
  getAttendanceHistory,
} = require("../controllers/attendanceController");
const { protect, protectAdminOrTeacher } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin & Teacher endpoints
router.get("/sheet", protectAdminOrTeacher, getAttendanceSheet);
router.post("/sheet", protectAdminOrTeacher, saveAttendanceSheet);
router.put("/sheet", protectAdminOrTeacher, updateAttendanceSheet);
router.get("/history", protectAdminOrTeacher, getAttendanceHistory);

// Student endpoints
router.get("/my-history", protect, getMyAttendanceHistory);

module.exports = router;
