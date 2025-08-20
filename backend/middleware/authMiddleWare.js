import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (!decoded?.userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

   
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;
