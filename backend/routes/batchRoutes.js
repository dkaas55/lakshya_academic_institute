const express = require("express");
const {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  listActiveBatches,
} = require("../controllers/batchController");
const { protect } = require("../middleware/authMiddleware");

const adminRouter = express.Router();

// All routes require an authenticated admin (protect middleware + role check is
// done inside the controller for clear error messages)
adminRouter.get("/", protect, getBatches);
adminRouter.post("/", protect, createBatch);
adminRouter.put("/:id", protect, updateBatch);
adminRouter.delete("/:id", protect, deleteBatch);

const publicRouter = express.Router();
publicRouter.get("/", protect, listActiveBatches);

module.exports = { adminRouter, publicRouter };
