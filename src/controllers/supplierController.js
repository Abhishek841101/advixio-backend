
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
          productCount: { $sum: 1 },
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
      _id: { $in: sellerIds },
      isActive: true,
    })
      .select("_id name companyName email phone city state createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const countMap = new Map(
      productCounts.map((item) => [
        String(item._id),
        item.productCount,
      ])
    );

    const suppliers = users.map((supplier) => ({
      ...supplier,
      productCount: countMap.get(String(supplier._id)) || 0,
      slug: String(supplier._id),
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


// import mongoose from "mongoose";
// import User from "../models/User.js";
// import Product from "../models/Product.js";

// function escapeRegex(value = "") {
//   return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// function normalizePage(value, fallback = 1) {
//   const parsed = Number.parseInt(value, 10);
//   return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
// }

// function getPublicSupplierSlug(supplier) {
//   return supplier.slug || String(supplier._id);
// }

// // GET /api/suppliers?page=1&limit=20&search=
// export const getSuppliers = async (req, res) => {
//   try {
//     const search = String(req.query.search || "")
//       .trim()
//       .slice(0, 100);

//     const page = normalizePage(req.query.page, 1);
//     const limit = Math.min(
//       50,
//       normalizePage(req.query.limit, 20)
//     );

//     const skip = (page - 1) * limit;

//     // TEMPORARY DEBUG: check database records
//     const [
//       totalUsers,
//       activeUsers,
//       missingIsActive,
//       totalProducts,
//       activeProducts,
//       productsWithSeller,
//     ] = await Promise.all([
//       User.countDocuments({}),
//       User.countDocuments({ isActive: true }),
//       User.countDocuments({
//         isActive: { $exists: false },
//       }),
//       Product.countDocuments({}),
//       Product.countDocuments({ status: "active" }),
//       Product.countDocuments({
//         seller: { $exists: true, $ne: null },
//       }),
//     ]);

//     console.log("===== SUPPLIER DEBUG =====");
//     console.log({
//       totalUsers,
//       activeUsers,
//       missingIsActive,
//       totalProducts,
//       activeProducts,
//       productsWithSeller,
//     });

//     // IMPORTANT:
//     // Do not filter by activeProductCount yet.
//     // Existing users may not have this field populated.
//     const filter = {
//       isActive: true,
//     };

//     if (search) {
//       const regex = new RegExp(escapeRegex(search), "i");

//       filter.$or = [
//         { name: regex },
//         { companyName: regex },
//         { city: regex },
//         { state: regex },
//       ];
//     }

//     const [total, users] = await Promise.all([
//       User.countDocuments(filter),

//       User.find(filter)
//         .select(
//           "_id slug name companyName city state createdAt activeProductCount"
//         )
//         .sort({ createdAt: -1, _id: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//     ]);

//     // Count active products for the displayed suppliers.
//     // This also works for older user records without activeProductCount.
//     const userIds = users.map((user) => user._id);

//     const productCounts = userIds.length
//       ? await Product.aggregate([
//           {
//             $match: {
//               seller: { $in: userIds },
//               status: "active",
//             },
//           },
//           {
//             $group: {
//               _id: "$seller",
//               productCount: { $sum: 1 },
//             },
//           },
//         ])
//       : [];

//     const countMap = new Map(
//       productCounts.map((item) => [
//         String(item._id),
//         item.productCount,
//       ])
//     );

//     const suppliers = users.map((user) => ({
//       _id: String(user._id),
//       slug: getPublicSupplierSlug(user),
//       name: user.name || "",
//       companyName: user.companyName || "",
//       city: user.city || "",
//       state: user.state || "",
//       createdAt: user.createdAt,
//       productCount: countMap.get(String(user._id)) || 0,
//     }));

//     return res.status(200).json({
//       success: true,
//       data: suppliers,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page * limit < total,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (error) {
//     console.error("Get suppliers error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch suppliers",
//     });
//   }
// };

// // GET /api/suppliers/:id
// // Supports MongoDB IDs and existing supplier slugs.
// export const getSupplierProfile = async (req, res) => {
//   try {
//     const { id } = req.params;

//     let supplier = null;

//     if (mongoose.Types.ObjectId.isValid(id)) {
//       supplier = await User.findOne({
//         _id: id,
//         isActive: true,
//       })
//         .select(
//           "_id slug name companyName email phone city state createdAt description website logo"
//         )
//         .lean();
//     }

//     if (!supplier) {
//       supplier = await User.findOne({
//         slug: id,
//         isActive: true,
//       })
//         .select(
//           "_id slug name companyName email phone city state createdAt description website logo"
//         )
//         .lean();
//     }

//     if (!supplier) {
//       return res.status(404).json({
//         success: false,
//         message: "Supplier not found",
//       });
//     }

//     const productFilter = {
//       seller: supplier._id,
//       status: "active",
//     };

//     const [productCount, products] = await Promise.all([
//       Product.countDocuments(productFilter),

//       Product.find(productFilter)
//         .select(
//           "_id name slug shortDescription description category subcategory brand model price unit images location createdAt"
//         )
//         .populate("category", "name slug")
//         .sort({ createdAt: -1, _id: -1 })
//         .limit(20)
//         .lean(),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: {
//         supplier: {
//           ...supplier,
//           slug: getPublicSupplierSlug(supplier),
//         },
//         productCount,
//         products,
//         productsLimit: 20,
//         hasMoreProducts: productCount > products.length,
//       },
//     });
//   } catch (error) {
//     console.error("Get supplier profile error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch supplier profile",
//     });
//   }
// };
