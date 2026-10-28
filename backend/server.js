import connectToMongo from "./middleware/db.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://excel-analytics-blush.vercel.app",
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"]),
].filter(Boolean);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use("/images", express.static("public/Images"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/history", historyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Server
app.listen(PORT, () => {
  connectToMongo();
  console.log(`Server running on port ${PORT}`);
});
