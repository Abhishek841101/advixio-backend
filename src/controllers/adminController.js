import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";


// ========================================
// SUPER ADMIN LOGIN
// ========================================


export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // TEMPORARY HARDCODED SUPER ADMIN CREDENTIALS
    const ADMIN_EMAIL = "admin@advixio360.com";
    const ADMIN_PASSWORD = "Advixio@(12)";

    if (
      email?.trim().toLowerCase() !== ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    const token = jwt.sign(
      {
        adminId: "hardcoded-superadmin",
        role: "superadmin",
        authType: "hardcoded",
      },
      process.env.ADMIN_JWT_SECRET || "advixio-temporary-admin-secret",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        id: "hardcoded-superadmin",
        name: "Super Admin",
        email: ADMIN_EMAIL,
        role: "superadmin",
        lastLogin: new Date(),
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed.",
    });
  }
};


// ========================================
// GET LOGGED-IN ADMIN PROFILE
// ========================================

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch admin profile.",
    });
  }
};


// ========================================
// CHANGE ADMIN PASSWORD
// ========================================

export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 12) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 12 characters long.",
      });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      admin.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    admin.password = await bcrypt.hash(newPassword, 12);

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error("Change Admin Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change admin password.",
    });
  }
};