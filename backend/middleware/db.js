import dotenv from "dotenv"
import mongoose from "mongoose";
dotenv.config()
const connectToMongo = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
}

export default connectToMongo;