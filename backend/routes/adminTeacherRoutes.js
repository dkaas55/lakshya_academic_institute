const express = require("express");
const {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/adminTeacherController");
const {
  getTeacherSalaryPayments,
  recordTeacherSalaryPayment,
  deleteTeacherSalaryPayment,
} = require("../controllers/SalaryController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require an authenticated admin (protect middleware + role check is
// done inside the controller for clear error messages)
router.get("/", protect, getTeachers);
router.post("/", protect, createTeacher);
router.put("/:id", protect, updateTeacher);
router.delete("/:id", protect, deleteTeacher);

// Teacher Salary Payment Routes
router.get("/:id/payments", protect, getTeacherSalaryPayments);
router.post("/:id/payments", protect, recordTeacherSalaryPayment);
router.delete("/:id/payments/:paymentId", protect, deleteTeacherSalaryPayment);

module.exports = router;
