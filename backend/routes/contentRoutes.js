const express = require("express");
const {
  getContents,
  createContent,
  deleteContent,
} = require("../controllers/contentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getContents);
router.post("/", protect, createContent);
router.delete("/:id", protect, deleteContent);

module.exports = router;
