
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";

// ==========================================
// SLUG HELPERS
// ==========================================

function makeSlug(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSupplierBase(user) {
  return makeSlug(user.companyName || user.name || "supplier") || "supplier";
}

function getSupplierSlug(user, duplicate = false) {
  const base = getSupplierBase(user);

  if (!duplicate) {
    return base;
  }

  return `${base}-${String(user._id).slice(-6).toLowerCase()}`;
}

function buildSupplierSlugs(users) {
  const counts = new Map();

  for (const user of users) {
    const base = getSupplierBase(user);
    counts.set(base, (counts.get(base) || 0) + 1);
  }

  return users.map((user) => {
    const base = getSupplierBase(user);
    const duplicate = (counts.get(base) || 0) > 1;

    return {
      ...user,
      slug: getSupplierSlug(user, duplicate),
    };
  });
}

// ==========================================
// GET SUPPLIER PROFILE
// GET /api/suppliers/:id
// Supports MongoDB ID or company slug.
// ==========================================


export const getSupplierProfile = async (req, res) => {
  try {
    const { id: slugOrId } = req.params;

    // Use the same supplier set as the supplier listing API.
    const productCounts = await Product.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$seller",
          productCount: { $sum: 1 },
        },
      },
    ]);

    const sellerIds = productCounts.map((item) => item._id);

    const users = await User.find({
      _id: { $in: sellerIds },
      isActive: true,
    })
      .select("_id name companyName email phone city state createdAt")
      .sort({ _id: 1 })
      .lean();

    const suppliersWithSlugs = buildSupplierSlugs(users);

    let supplier = null;

    // Support existing MongoDB ID URLs.
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      supplier =
        suppliersWithSlugs.find(
          (user) => String(user._id) === slugOrId
        ) || null;
    }

    // Support company slug URLs.
    if (!supplier) {
      supplier =
        suppliersWithSlugs.find(
          (user) => user.slug === slugOrId
        ) || null;
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
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        supplier: {
          _id: String(supplier._id),
          name: supplier.name || "",
          companyName: supplier.companyName || "",
          email: supplier.email || "",
          phone: supplier.phone || "",
          city: supplier.city || "",
          state: supplier.state || "",
          createdAt: supplier.createdAt,
          slug: supplier.slug,
        },
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

// ==========================================
// GET SUPPLIERS
// GET /api/suppliers
// ==========================================

export const getSuppliers = async (req, res) => {
  try {
    // Count active products for each seller.
    const productCounts = await Product.aggregate([
      {
        $match: {
          status: "active",
        },
      },
      {
        $group: {
          _id: "$seller",
          productCount: {
            $sum: 1,
          },
        },
      },
    ]);

    const sellerIds = productCounts.map((item) => item._id);

    if (sellerIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const users = await User.find({
      _id: {
        $in: sellerIds,
      },
      isActive: true,
    })
      .select("_id name companyName email phone city state createdAt")
      .sort({ _id: 1 })
      .lean();

    // Map product counts to their seller IDs.
    const countMap = new Map(
      productCounts.map((item) => [
        String(item._id),
        item.productCount,
      ])
    );

    // Generate consistent, unique supplier slugs.
    const suppliersWithSlugs = buildSupplierSlugs(users);

    const suppliers = suppliersWithSlugs.map((supplier) => ({
      _id: String(supplier._id),
      name: supplier.name || "",
      companyName: supplier.companyName || "",
      city: supplier.city || "",
      state: supplier.state || "",
      createdAt: supplier.createdAt,
      slug: supplier.slug,
      productCount: countMap.get(String(supplier._id)) || 0,
    }));

    return res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error("Get suppliers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
    });
  }
};
