
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  "advixio-temporary-admin-secret";

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin token required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin access required.",
      });
    }

    if (decoded.authType === "hardcoded") {
      if (decoded.adminId !== "hardcoded-superadmin") {
        return res.status(401).json({
          success: false,
          message: "Invalid admin token.",
        });
      }

      req.admin = {
        _id: null,
        id: "hardcoded-superadmin",
        name: "Super Admin",
        email: "admin@advixio360.com",
        role: "superadmin",
        isActive: true,
        isHardcodedAdmin: true,
      };

      return next();
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin || !admin.isActive || admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Admin access denied.",
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin session.",
    });
  }
};

export default adminMiddleware;
