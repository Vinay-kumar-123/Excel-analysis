import express from "express";
import {
  getHistory,
  getHistoryById,
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
} from "../controllers/historyController.js";
import authMiddleware from "../middleware/authMiddleWare.js";

const router = express.Router();

// All history routes require authenticated session
router.use(authMiddleware);

router.get("/", getHistory);
router.post("/", createHistoryEntry);
router.delete("/", clearHistory);

router.get("/:id", getHistoryById);
router.patch("/:id", updateHistoryEntry);
router.delete("/:id", deleteHistoryEntry);

export default router;
