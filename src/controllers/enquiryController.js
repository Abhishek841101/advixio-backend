
import mongoose from "mongoose";
import Enquiry from "../models/Enquiry.js";
import Product from "../models/Product.js";

/* =====================================================
   CREATE ENQUIRY
   POST /api/enquiries
   Public endpoint: buyer login is not required.
===================================================== */

export const createEnquiry = async (req, res) => {
  try {
    const {
      productSlug,
      buyerName,
      buyerPhone,
      quantity,
      message,
    } = req.body || {};

    if (
      typeof productSlug !== "string" ||
      !productSlug.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Product is required.",
      });
    }

    if (
      typeof buyerName !== "string" ||
      buyerName.trim().length < 2 ||
      buyerName.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid full name.",
      });
    }

    const phone = String(buyerPhone || "").trim();
    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid mobile number.",
      });
    }

    if (
      typeof message !== "string" ||
      message.trim().length < 5 ||
      message.trim().length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please describe your requirement.",
      });
    }

    const cleanQuantity =
      typeof quantity === "string"
        ? quantity.trim().slice(0, 100)
        : "";

    const product = await Product.findOne({
      slug: productSlug.trim(),
    }).populate(
      "seller",
      "name email phone companyName city state isActive"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.status && product.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This product is not currently accepting enquiries.",
      });
    }

    const supplierId =
      product.seller?._id || product.seller;

    if (
      !supplierId ||
      !mongoose.Types.ObjectId.isValid(String(supplierId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Supplier is not available for this product.",
      });
    }

    if (
      product.seller &&
      typeof product.seller === "object" &&
      product.seller.isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message: "This supplier is currently unavailable.",
      });
    }

    const enquiry = await Enquiry.create({
      product: product._id,
      supplier: supplierId,
      buyerName: buyerName.trim(),
      buyerPhone: phone,
      quantity: cleanQuantity,
      message: message.trim(),
      status: "new",
    });

    return res.status(201).json({
      success: true,
      message: "Your enquiry has been submitted successfully.",
      data: {
        id: enquiry._id,
        status: enquiry.status,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (error) {
    console.error("Create enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit your enquiry right now.",
    });
  }
};

/* =====================================================
   GET MY ENQUIRIES
   GET /api/enquiries/my
   Supplier authentication required.
===================================================== */

export const getMyEnquiries = async (req, res) => {
  try {
    const supplierId = req.user?._id || req.user?.id;

    if (!supplierId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const enquiries = await Enquiry.find({
      supplier: supplierId,
    })
      .populate("product", "name slug images price unit")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error("Get supplier enquiries error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load enquiries.",
    });
  }
};

/* =====================================================
   UPDATE ENQUIRY STATUS
   PATCH /api/enquiries/:id/status
   Supplier can update only their own enquiries.
===================================================== */

export const updateEnquiryStatus = async (req, res) => {
  try {
    const supplierId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { status } = req.body || {};

    if (!supplierId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    const allowedStatuses = ["new", "contacted", "closed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry status.",
      });
    }

    const enquiry = await Enquiry.findOneAndUpdate(
      {
        _id: id,
        supplier: supplierId,
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("product", "name slug images price unit")
      .lean();

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated.",
      data: enquiry,
    });
  } catch (error) {
    console.error("Update enquiry status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update enquiry status.",
    });
  }
};
