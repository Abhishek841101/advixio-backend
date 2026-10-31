import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Admin token is required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.ADMIN_JWT_SECRET) {
      console.error("ADMIN_JWT_SECRET is missing in environment variables.");

      return res.status(500).json({
        success: false,
        message: "Admin authentication configuration error.",
      });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (!decoded.adminId) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin || !admin.isActive || admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Admin access is not authorized.",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Admin session expired. Please login again."
          : "Invalid admin token.",
    });
  }
};

export default adminMiddleware;