
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";

// Escape special characters for safe regex search
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/users
// GET /api/admin/users?type=supplier
// GET /api/admin/users?search=abc&page=1&limit=20
export const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;
    const type = req.query.type || "all";
    const search = String(req.query.search || "").trim();

    if (!["all", "supplier", "buyer"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type.",
      });
    }

    // Count products for each seller
    const productCounts = await Product.aggregate([
      {
        $match: {
          seller: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$seller",

          totalProductCount: {
            $sum: 1,
          },

          activeProductCount: {
            $sum: {
              $cond: [
                { $eq: ["$status", "active"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const productCountMap = new Map(
      productCounts.map((item) => [
        String(item._id),
        {
          totalProductCount: item.totalProductCount,
          activeProductCount: item.activeProductCount,
        },
      ])
    );

    const supplierIds = productCounts.map((item) => item._id);

    const filter = {};

    if (type === "supplier") {
      filter._id = { $in: supplierIds };
    } else if (type === "buyer") {
      filter._id = { $nin: supplierIds };
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { companyName: regex },
        { city: regex },
        { state: regex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const formattedUsers = users.map((user) => {
      const stats = productCountMap.get(String(user._id));

      return {
        ...user,
        totalProductCount: stats?.totalProductCount || 0,
        activeProductCount: stats?.activeProductCount || 0,
        isSupplier: Boolean(stats),
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin Get Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
};


// GET /api/admin/users/:id
export const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const [totalProductCount, activeProductCount] = await Promise.all([
      Product.countDocuments({
        seller: user._id,
      }),

      Product.countDocuments({
        seller: user._id,
        status: "active",
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        totalProductCount,
        activeProductCount,
        isSupplier: totalProductCount > 0,
      },
    });
  } catch (error) {
    console.error("Admin Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user details.",
    });
  }
};


// PUT /api/admin/users/:id
export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "companyName",
      "city",
      "state",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (updates.email !== undefined) {
      updates.email = updates.email.toLowerCase();

      if (!updates.email) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }

      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered.",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Admin Update User Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update user.",
    });
  }
};


// PATCH /api/admin/users/:id/status
export const updateAdminUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully."
        : "User deactivated successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Admin Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status.",
    });
  }
};
