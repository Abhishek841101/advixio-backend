
import express from "express";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createProduct,
  getProducts,
  getProductBySlug,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getProductsByCategorySlug,
} from "../controllers/productController.js";

const router = express.Router();

// Authenticated user's listings — before /:slug
router.get("/my-listings", protect, getMyProducts);

// All active products
router.get("/", getProducts);

// Products by category slug — before /:slug
router.get("/category/:slug", getProductsByCategorySlug);

// Single product by slug
router.get("/:slug", getProductBySlug);

// Create product
router.post(
  "/",
  protect,
  upload.array("images", 3),
  createProduct
);

// Update product by MongoDB ID
router.put("/:id", protect, updateProduct);

// Delete product by MongoDB ID
router.delete("/:id", protect, deleteProduct);

export default router;
