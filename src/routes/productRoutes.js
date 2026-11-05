
import express from "express";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import bulkExcelUpload from "../middleware/bulkExcelUploadMiddleware.js";

import {
  createProduct,
  getProducts,
  getProductBySlug,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getProductsByCategorySlug,
  bulkUploadProducts,
} from "../controllers/productController.js";

const router = express.Router();

// Bulk Excel Upload
router.post(
  "/bulk-upload",
  protect,
  bulkExcelUpload.single("file"),
  bulkUploadProducts
);

// My listings
router.get("/my-listings", protect, getMyProducts);

// All products
router.get("/", getProducts);

// Category products
router.get("/category/:slug", getProductsByCategorySlug);

// Create product
router.post("/", protect, upload.array("images", 3), createProduct);

// Update product
router.put(
  "/:id",
  protect,
  upload.array("newImages"),
  updateProduct
);
// router.put("/:id", protect, updateProduct);

// Delete product
router.delete("/:id", protect, deleteProduct);

// Single product
router.get("/:slug", getProductBySlug);

export default router;
