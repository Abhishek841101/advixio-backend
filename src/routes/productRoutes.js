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

// ==========================================
// MY LISTINGS
// ==========================================

router.get(
  "/my-listings",
  protect,
  getMyProducts
);

// ==========================================
// ALL PRODUCTS
// ==========================================

router.get(
  "/",
  getProducts
);

// ==========================================
// PRODUCTS BY CATEGORY
// IMPORTANT: This must come before /:slug
// ==========================================

router.get(
  "/category/:slug",
  getProductsByCategorySlug
);

// ==========================================
// SINGLE PRODUCT
// ==========================================

router.get(
  "/:slug",
  getProductBySlug
);

// ==========================================
// CREATE PRODUCT
// ==========================================

router.post(
  "/",
  protect,
  upload.array("images", 3),
  createProduct
);

// ==========================================
// UPDATE PRODUCT
// ==========================================

router.put(
  "/:id",
  protect,
  updateProduct
);

// ==========================================
// DELETE PRODUCT
// ==========================================

router.delete(
  "/:id",
  protect,
  deleteProduct
);

export default router;