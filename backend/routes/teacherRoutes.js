const express = require("express");
const { getTeacherDashboard } = require("../controllers/teacherController");
const { getSalaryOverview } = require("../controllers/SalaryController");
const { protectTeacher } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/teacher/dashboard — teacher-only protected route
router.get("/dashboard", protectTeacher, getTeacherDashboard);
router.get("/salary-overview", protectTeacher, getSalaryOverview);

module.exports = router;
