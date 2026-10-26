
import express from "express";
import {
  getSuppliers,
  getSupplierProfile,
} from "../controllers/supplierController.js";

const router = express.Router();

// GET /api/suppliers
router.get("/", getSuppliers);

// GET /api/suppliers/:id
router.get("/:id", getSupplierProfile);

export default router;
