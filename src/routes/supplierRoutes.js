
import express from "express";
import {
  getSupplierProfile,
} from "../controllers/supplierController.js";

const router = express.Router();

router.get("/:id", getSupplierProfile);

export default router;
