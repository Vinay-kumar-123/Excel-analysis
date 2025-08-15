import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs"; 
import path from "path";
import XLSX from "xlsx";
import { error } from "console";
import { GoogleGenerativeAI } from "@google/generative-ai";



export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(201).json({
      success: false,
      message: "failed to register",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.name}`,
        success: true,
        user,
      });
  } catch (error) {
    console.log(error);
  }
};
export const logout = async(req,res)=> {
  try {
    return res.status(200).cookie("token", "", {maxAge:0}).json({
      message:"Logout successfully",
      success:true
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
       success:false,
       message:"Failed to logout"
    })
  }
}


const genAI = new GoogleGenerativeAI(process.env.GEMNI_AI_API, {
  apiVersion: "v1",
});
export const GemniApi = async(req, res) => {
  try {
    const { data, query } = req.body;
    const prompt = `${query}:\n\n${JSON.stringify(data)}`;
    
    const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});
    const result = await model.generateContent(prompt);

   if (!result || !result.response) {
      console.error("❌ Gemini: No response from model");
      return res.status(500).json({ error: "No response from Gemini model." });
    }

    const text = await result.response.text();
    

    res.json({ reply: text });
  } catch (error) {
    console.error("Gemini Error:", error.message);
    res.status(500).json({ error: "Gemini AI analysis failed." });
  }
}
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = "./public/Images";
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = `${Date.now()}_${file.originalname}`;
//     cb(null, uniqueName);
//   },
// });

// export const uploadMiddleware = multer({ 
//   storage ,
//   fileFilter:(req, file, cb) => {
//     if(file.mimetype.startsWith("image/")) cb(null, true);
//     else cb(new error("only image files are allowed"), false);
//   }
// });

// // ========== UPLOAD HANDLER ==========


// // 👇 Keep your multer setup same

// export const handleUpload = async(req, res) => {
//   // if (!req.file) {
//   //   return res.status(400).json({ success: false, message: "No file uploaded" });
//   // }
//   const imageUrl =  `/images/${req.file.filename}`;
//   try {
//     await User.findByIdAndUpdate(req.user.id, { photoImage: imageUrl });
//     res.json({ imageUrl });
//   } catch (error) {
//     console.error("Upload error:", err);
//     res.status(500).json({ success: false, message: "Image upload failed" });
//   }
 

  
//   // const filePath = path.join("public", "Images", req.file.filename);
//   // try {
//   //   const workbook = XLSX.readFile(filePath);
//   //   const sheetName = workbook.SheetNames[0];
//   //   const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//   //   res.status(200).json({
//   //     success: true,
//   //     message: "File uploaded and read successfully",
//   //     filename: req.file.filename,
//   //     path: `/images/${req.file.filename}`,
//   //     excelData: data, // 👈 Excel content as JSON
//   //   });
//   // } catch (err) {
//   //   console.error("Error reading Excel file:", err);
//   //   res.status(500).json({ success: false, message: "Failed to read Excel file" });
//   // }
// };


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./public/Images";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});




export const upload = multer({ storage });


