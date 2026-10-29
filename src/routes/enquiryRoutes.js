
import express from "express";

import {
  createEnquiry,
  getMyEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiryController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Public: no buyer login required */
router.post("/", createEnquiry);

/* Protected supplier dashboard endpoints */
router.get("/my", protect, getMyEnquiries);
router.patch("/:id/status", protect, updateEnquiryStatus);

export default router;
