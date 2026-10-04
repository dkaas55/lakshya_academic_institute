const express = require("express");
const {
  getLedger,
  collectInstallment,
  updatePaymentTiming,
  getAllTransactions,
  getPendingDues,
} = require("../controllers/feeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/transactions", protect, getAllTransactions);
router.get("/pending", protect, getPendingDues);
router.get("/ledger/:studentId", protect, getLedger);
router.patch("/ledger/:studentId/timing", protect, updatePaymentTiming);
router.post("/collect/:studentId", protect, collectInstallment);

module.exports = router;
