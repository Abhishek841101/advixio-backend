import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Category from "../models/Category.js";

// ==========================================
// ADMIN DASHBOARD STATISTICS
// GET /api/admin/products/stats
// ==========================================

export const getAdminProductStats = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      pendingProducts,
      totalUsers,
      supplierIds,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "inactive" }),
      Product.countDocuments({ status: "pending" }),
      User.countDocuments(),
      Product.distinct("seller", { status: "active" }),
    ]);

    const suppliers = supplierIds.length;
    const buyers = Math.max(0, totalUsers - suppliers);

    return res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        pendingProducts,
        totalUsers,
        suppliers,
        buyers,
      },
    });
  } catch (error) {
    console.error("Admin product stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

// ==========================================
// ADMIN: GET ALL PRODUCTS
// GET /api/admin/products
// ==========================================

export const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "all").toLowerCase();

    const filter = {};

    if (["active", "inactive", "pending"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      const [matchingUsers, matchingCategories] = await Promise.all([
        User.find({
          $or: [
            { name: regex },
            { companyName: regex },
            { email: regex },
          ],
        }).select("_id"),

        Category.find({
          name: regex,
        }).select("_id"),
      ]);

      const matchingSellerIds = matchingUsers.map((user) => user._id);
      const matchingCategoryIds = matchingCategories.map(
        (category) => category._id
      );

      filter.$or = [
        { name: regex },
        { brand: regex },
        { model: regex },
        { companyName: regex },
        { subcategory: regex },
        { seller: { $in: matchingSellerIds } },
        { category: { $in: matchingCategoryIds } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("seller", "name email phone companyName city state")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// ==========================================
// ADMIN: UPDATE PRODUCT STATUS
// PATCH /api/admin/products/:id/status
// ==========================================

export const updateAdminProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!["active", "inactive", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active, inactive or pending",
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate("category", "name slug")
      .populate("seller", "name email phone companyName city state");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product status changed to ${status}`,
      data: product,
    });
  } catch (error) {
    console.error("Admin update product status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product status",
    });
  }
};