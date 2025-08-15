// import express from "express"
// import {login, logout, register} from "../controllers/authController.js"
// const router = express.Router()
// router.route("/register").post(register);
// router.route("/login").post(login);
// router.route("/logout").get(logout);

// export default router;



import express from "express";
import {
  register,
  login,
  logout,
  // uploadMiddleware,
  // handleUpload,
  upload,
  GemniApi,
} from "../controllers/authController.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// 👇 file upload route
router.post("/upload", upload.single("image"),  (req, res) => {
  // const imageUrl = `/uploads/${req.file.filename}`;
  // await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl });
  // res.json({ imageUrl });
  if(!req.file){
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.status(200).json({ filename: req.file.filename });

});

router.post("/gemni", GemniApi);
export default router;



