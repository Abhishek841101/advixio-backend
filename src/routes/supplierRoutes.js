
import express from "express";
import {
  getSuppliers,
  getSupplierProfile,
} from "../controllers/supplierController.js";

const router = express.Router();

// GET /api/suppliers?search=steel&page=1&limit=20
router.get("/", getSuppliers);

// GET /api/suppliers/:id
// Supports MongoDB IDs and persisted supplier slugs.
router.get("/:id", getSupplierProfile);

export default router;
