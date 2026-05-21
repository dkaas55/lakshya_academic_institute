const express = require("express");
const { getTests, createTest, deleteTest } = require("../controllers/testController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTests);
router.post("/", protect, createTest);
router.delete("/:id", protect, deleteTest);

module.exports = router;
