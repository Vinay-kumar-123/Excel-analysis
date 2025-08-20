


import express from "express";
import {
  register,
  login,
  logout,
  // uploadMiddleware,
  // handleUpload,
  GemniApi,
} from "../controllers/authController.js";

import upload from "../multer/multer.js";
import { updatePhoto } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleWare.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// // 👇 file upload route
// router.post("/upload", upload.single("image"),  (req, res) => {
//   // const imageUrl = `/uploads/${req.file.filename}`;
//   // await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl });
//   // res.json({ imageUrl });
//   if(!req.file){
//     return res.status(400).json({ message: "No file uploaded" });
//   }
//   res.status(200).json({ filename: req.file.filename });

// });


router.post("/gemni", GemniApi);
router.put("/update-photo", authMiddleware,upload.single("image"), updatePhoto);

export default router;



