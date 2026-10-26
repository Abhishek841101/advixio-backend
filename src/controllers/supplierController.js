
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";

function makeSlug(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const getSupplierProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // First try an exact MongoDB User ID.
    let supplier = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      supplier = await User.findOne({
        _id: id,
        isActive: true,
      })
        .select("_id name companyName email phone city state createdAt")
        .lean();
    }

    // If not an ID, find the supplier by company-name slug.
    if (!supplier) {
      const users = await User.find({ isActive: true })
        .select("_id name companyName email phone city state createdAt")
        .lean();

      const matches = users.filter((user) => {
        const companySlug = makeSlug(user.companyName || "");
        const nameSlug = makeSlug(user.name || "");

        return companySlug === id || nameSlug === id;
      });

      if (matches.length > 1) {
        return res.status(409).json({
          success: false,
          message:
            "This supplier slug is ambiguous. Use the supplier's MongoDB ID or create unique supplier slugs.",
        });
      }

      supplier = matches[0] || null;
    }

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

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
    });
  }
};
