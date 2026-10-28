import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const secret = process.env.SECRET_KEY;
    if (!secret) {
      console.error("SECRET_KEY environment variable is not defined");
      return res.status(500).json({
        success: false,
        message: "Internal server configuration error",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded?.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session is no longer valid. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(error.name)) {
      return res.status(401).json({
        success: false,
        message: error.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Invalid authentication token. Please log in again.",
      });
    }
    return next(error);
  }
};

export default authMiddleware;
