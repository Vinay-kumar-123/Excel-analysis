import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  GemniApi,
  updatePhoto,
} from "../controllers/authController.js";
import {
  getHistory,
  getHistoryById,
  createHistoryEntry,
  updateHistoryEntry,
  deleteHistoryEntry,
  clearHistory,
} from "../controllers/historyController.js";
import upload from "../multer/multer.js";
import authMiddleware from "../middleware/authMiddleWare.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// Protected routes (require valid JWT session cookie or Bearer token)
router.get("/me", authMiddleware, getProfile);
router.post("/gemni", authMiddleware, GemniApi);
router.put("/update-photo", authMiddleware, upload.single("image"), updatePhoto);

// History routes (protected)
router.get("/history", authMiddleware, getHistory);
router.post("/history", authMiddleware, createHistoryEntry);
router.get("/history/:id", authMiddleware, getHistoryById);
router.patch("/history/:id", authMiddleware, updateHistoryEntry);
router.delete("/history/:id", authMiddleware, deleteHistoryEntry);
router.delete("/history", authMiddleware, clearHistory);

export default router;
