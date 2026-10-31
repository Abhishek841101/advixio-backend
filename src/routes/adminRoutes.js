import express from "express";

import {
  adminLogin,
  getAdminProfile,
  changeAdminPassword,
} from "../controllers/adminController.js";

import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();


// Public route
router.post("/login", adminLogin);


// Protected routes
router.get("/me", adminMiddleware, getAdminProfile);

router.put(
  "/change-password",
  adminMiddleware,
  changeAdminPassword
);

export default router;