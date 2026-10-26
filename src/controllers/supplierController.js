
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePage(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPublicSupplierSlug(supplier) {
  // Prefer a persisted, unique SEO slug.
  // Fall back to the MongoDB ID for older records.
  return supplier.slug || String(supplier._id);
}

export const getSuppliers = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().slice(0, 100);
    const page = normalizePage(req.query.page);
    const limit = Math.min(50, normalizePage(req.query.limit, 20));
    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,
      activeProductCount: { $gt: 0 },
    };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { name: regex },
        { companyName: regex },
        { city: regex },
        { state: regex },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select(
          "_id slug name companyName city state createdAt activeProductCount"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const suppliers = users.map((user) => ({
      _id: String(user._id),
      slug: getPublicSupplierSlug(user),
      name: user.name || "",
      companyName: user.companyName || "",
      city: user.city || "",
      state: user.state || "",
      createdAt: user.createdAt,
      productCount: user.activeProductCount || 0,
    }));

    return res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get suppliers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
    });
  }
};

export const getSupplierProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let supplier = null;

    // Existing MongoDB-ID URLs continue to work.
    if (mongoose.Types.ObjectId.isValid(id)) {
      supplier = await User.findOne({
        _id: id,
        isActive: true,
      })
        .select(
          "_id slug name companyName email phone city state createdAt description website logo"
        )
        .lean();
    }

    // New SEO URLs use a persisted, unique slug.
    if (!supplier) {
      supplier = await User.findOne({
        slug: id,
        isActive: true,
      })
        .select(
          "_id slug name companyName email phone city state createdAt description website logo"
        )
        .lean();
    }

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const productFilter = {
      seller: supplier._id,
      status: "active",
    };

    // Count separately; return only the first 20 products.
    const [productCount, products] = await Promise.all([
      Product.countDocuments(productFilter),
      Product.find(productFilter)
        .select(
          "_id name slug shortDescription description category subcategory brand model price unit images location createdAt"
        )
        .populate("category", "name slug")
        .sort({ createdAt: -1, _id: -1 })
        .limit(20)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        supplier: {
          ...supplier,
          slug: getPublicSupplierSlug(supplier),
        },
        productCount,
        products,
        productsLimit: 20,
        hasMoreProducts: productCount > products.length,
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
