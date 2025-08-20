// import express from  "express";
// import dotenv from "dotenv";
//import connectToMongo from "./middleware/db.js";
// import cors from "cors";
// import userRoute from "./routes/userRoutes.js"
// import cookieParser from "cookie-parser";
//import multer from "multer";
// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 3000;


// app.use(express.json()); 
// app.use(cookieParser());
// app.use(express.urlencoded({extended:true}));

// app.use(cors({
//   origin: "http://localhost:3000",
//   credentials: true
// }));


// app.use("/api/v1/user", userRoute)

// app.listen(PORT, () => {
//     connectToMongo();
//     console.log(`Server is running on port ${PORT}`);
// });
import connectToMongo from "./middleware/db.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();
const app = express();

// Middlewares
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/images", express.static("public/Images"));

// Routes
app.use("/api/v1/user", userRoutes);

// Server
app.listen(8000, () => {
  connectToMongo();
  console.log("Server running on port 8000");
});
