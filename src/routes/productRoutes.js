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
} from "../controllers/productController.js";

const router = express.Router();

router.get("/my-listings", protect, getMyProducts);

router.get("/", getProducts);

router.get("/:slug", getProductBySlug);

router.post(
  "/",
  protect,
  upload.array("images", 3),
  createProduct
);

router.put("/:id", protect, updateProduct);

router.delete("/:id", protect, deleteProduct);

export default router;