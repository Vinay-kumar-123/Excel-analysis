import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectToMongo = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("⚠️ MONGO_URI is not set in environment variables.");
      return;
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
  }
};

export default connectToMongo;
