
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";

dotenv.config();

const createSuperAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } =
      process.env;

    // Validate environment variables
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin environment variables are missing.");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must be at least 12 characters.");
    }

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected.");

    const email = ADMIN_EMAIL.toLowerCase().trim();

    // Check existing admin
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("Super Admin already exists.");
      return;
    }

    // Prevent accidental creation of multiple admins
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      throw new Error(
        "A Super Admin already exists. Only one admin is allowed."
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // Create Super Admin
    await Admin.create({
      name: ADMIN_NAME.trim(),
      email,
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
    });

    console.log("Super Admin created successfully.");
    console.log("Admin Email:", email);
  } catch (error) {
    console.error("Super Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

createSuperAdmin();
