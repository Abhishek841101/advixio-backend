
import mongoose from "mongoose";

// ==========================================
// SPECIFICATION SCHEMA
// ==========================================

const specificationSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// CUSTOM FIELD SCHEMA
// ==========================================

const customFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// PRODUCT SCHEMA
// ==========================================

const productSchema = new mongoose.Schema(
  {
    // Product name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Normalized name for case-insensitive duplicate checks.
    // Do not enable the unique index until existing records
    // have been migrated and duplicate names resolved.
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // SEO-friendly product URL
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: String,
      trim: true,
      default: "",
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    model: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      default: undefined,
      min: 0,
    },

    unit: {
      type: String,
      trim: true,
      default: "Piece",
    },

    images: {
      type: [String],
      default: [],
    },

    specifications: {
      type: [specificationSchema],
      default: [],
    },

    customFields: {
      type: [customFieldSchema],
      default: [],
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      city: {
        type: String,
        trim: true,
        default: "",
      },

      state: {
        type: String,
        trim: true,
        default: "",
      },

      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

 // ==========================================
 // INDEXES
 // ==========================================

// Supports supplier product counts and active product listings.
productSchema.index({
  seller: 1,
  status: 1,
  createdAt: -1,
  _id: -1,
});

// Slug uniqueness is already declared on the slug field.
// Add normalizedName unique index only after migration
// and resolving existing duplicates.

// ==========================================
// MODEL
// ==========================================

const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;
