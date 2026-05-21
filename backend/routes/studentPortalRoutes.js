const express = require("express");
const { getStudentDashboard } = require("../controllers/studentDashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/student/dashboard
router.get("/dashboard", protect, getStudentDashboard);

module.exports = router;
