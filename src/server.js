import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import cloudinary from "./config/cloudinary.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // ==========================================
    // 1. CONNECT MONGODB
    // ==========================================

    await connectDB();

    // ==========================================
    // 2. CONNECT CLOUDINARY
    // ==========================================

    await cloudinary.api.ping();

    console.log("✅ Cloudinary connected");

    // ==========================================
    // 3. START EXPRESS SERVER
    // ==========================================

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:");
    console.error(error);

    process.exit(1);
  }
};

startServer();