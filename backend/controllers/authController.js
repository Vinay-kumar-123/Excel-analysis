import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import cloudinary from "../cloudinary/cloudinary.js";
import { buildGeminiPrompt } from "../lib/geminiPrompt.js";

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
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register",
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
    const secureCookie = process.env.NODE_ENV === "production";
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: secureCookie ? "none" : "lax",
        path: "/",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.name}`,
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo,
          description: user.description,
        },
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login. Please try again later.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const secureCookie = process.env.NODE_ENV === "production";
    return res.status(200).clearCookie("token", {
      httpOnly: true,
      secure: secureCookie,
      sameSite: secureCookie ? "none" : "lax",
      path: "/",
    }).json({
      message: "Logout successfully",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

export const GemniApi = async (req, res) => {
  try {
    const { data, query } = req.body;
    if ((!Array.isArray(data) && typeof data !== "string") || data.length === 0) {
      return res.status(400).json({ error: "Provide spreadsheet data as a non-empty row array or text." });
    }

    const apiKey = process.env.GEMNI_AI_API || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildGeminiPrompt(data, query, req.body.datasetInfo);

    let text = "";
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const contentRes = await ai.models.generateContent({ model, contents: prompt });
        text = typeof contentRes.text === "string" ? contentRes.text.trim() : "";
        if (text) break;
      } catch (err) {
        const isTransient =
          err.status === 503 ||
          err.status === 429 ||
          (err.message && err.message.includes("high demand"));
        if (isTransient && attempt < 3) {
          console.warn(`Gemini API transient spike (attempt ${attempt}/3), retrying in ${attempt * 1000}ms...`);
          await new Promise((r) => setTimeout(r, attempt * 1000));
        } else {
          console.error("Gemini provider request failed:", {
            status: err.status || "unknown",
            code: err.code || "unknown",
          });
          throw err;
        }
      }
    }

    if (!text) {
      return res.status(502).json({ error: "Gemini returned an empty response. Please try again with a more specific question." });
    }

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Gemini analysis failed:", {
      status: error.status || "unknown",
      code: error.code || "unknown",
    });
    return res.status(502).json({
      error: "Gemini could not complete the analysis. Please retry shortly or try a more specific question.",
    });
  }
};

export const updatePhoto = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "user_profiles" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.photo = result.secure_url;
    await user.save();

    return res.json({
      message: "Photo updated successfully",
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        description: user.description,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
