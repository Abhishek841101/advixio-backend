
import express from "express";

import {
  createEnquiry,
  getMyEnquiries,
  updateEnquiryStatus,
  getAllEnquiriesForAdmin,
} from "../controllers/enquiryController.js";

import protect from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* Public: no buyer login required */
router.post("/", createEnquiry);

/* Admin: all suppliers' enquiries */
router.get("/admin/all", adminMiddleware, getAllEnquiriesForAdmin);

/* Protected supplier dashboard endpoints */
router.get("/my", protect, getMyEnquiries);
router.patch("/:id/status", protect, updateEnquiryStatus);

export default router;
