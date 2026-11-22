import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";


// ========================================
// SUPER ADMIN LOGIN
// ========================================

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (!process.env.ADMIN_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Admin authentication is not configured.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const admin = await Admin.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your admin account is inactive.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin access required.",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
        role: admin.role,
      },
      process.env.ADMIN_JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    admin.lastLogin = new Date();
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Super Admin login successful.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during admin login.",
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