
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";

// ==========================================
// GET SUPPLIER PROFILE + ACTIVE PRODUCTS
// GET /api/suppliers/:id
// ==========================================

export const getSupplierProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate supplier MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    // 2. Fetch supplier details
    // Never return the password field.
    const supplier = await User.findOne({
      _id: id,
      isActive: true,
    })
      .select(
        "_id name companyName email phone city state createdAt"
      )
      .lean();

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // 3. Fetch this supplier's active products
    const products = await Product.find({
      seller: supplier._id,
      status: "active",
    })
      .select(
        "_id name slug shortDescription description category subcategory brand model price unit images location createdAt"
      )
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    // 4. Return real database data
    return res.status(200).json({
      success: true,
      data: {
        supplier,
        productCount: products.length,
        products,
      },
    });
  } catch (error) {
    console.error("Get supplier profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier profile",
      ...(process.env.NODE_ENV === "development"
        ? { error: error.message }
        : {}),
    });
  }
};
