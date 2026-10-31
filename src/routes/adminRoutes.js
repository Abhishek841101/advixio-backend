
import express from "express";

import {
  adminLogin,
  getAdminProfile,
  changeAdminPassword,
} from "../controllers/adminController.js";

import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  updateAdminUserStatus,
} from "../controllers/adminUserController.js";

import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public route
router.post("/login", adminLogin);

// Protected admin profile routes
router.get("/me", adminMiddleware, getAdminProfile);

router.put(
  "/change-password",
  adminMiddleware,
  changeAdminPassword
);

// User management routes
router.get("/users", adminMiddleware, getAdminUsers);

router.get("/users/:id", adminMiddleware, getAdminUserById);

router.put("/users/:id", adminMiddleware, updateAdminUser);

router.patch(
  "/users/:id/status",
  adminMiddleware,
  updateAdminUserStatus
);

export default router;
