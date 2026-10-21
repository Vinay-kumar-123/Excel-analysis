import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  GemniApi,
  updatePhoto,
} from "../controllers/authController.js";
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

export default router;
