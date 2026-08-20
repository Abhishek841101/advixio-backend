// import mongoose from "mongoose";

// const specificationSchema = new mongoose.Schema(
//   {
//     label: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     value: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//   },
//   { _id: false }
// );

// const productSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     slug: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },

//     shortDescription: {
//       type: String,
//       trim: true,
//     },

//     description: {
//       type: String,
//       trim: true,
//     },

//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },

//     subcategory: {
//       type: String,
//       trim: true,
//     },

//     brand: {
//       type: String,
//       trim: true,
//     },

//     model: {
//       type: String,
//       trim: true,
//     },

//     price: {
//       type: Number,
//     },

//     unit: {
//       type: String,
//       default: "Piece",
//       trim: true,
//     },

//     images: [
//       {
//         type: String,
//       },
//     ],

//     specifications: [specificationSchema],

//     // Product owner
//     seller: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     companyName: {
//       type: String,
//       trim: true,
//     },

//     location: {
//       city: String,
//       state: String,
//       country: {
//         type: String,
//         default: "India",
//       },
//     },

//     status: {
//       type: String,
//       enum: ["active", "inactive", "pending"],
//       default: "active",
//     },

//     isFeatured: {
//       type: Boolean,
//       default: false,
//     },

//     views: {
//       type: Number,
//       default: 0,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Product = mongoose.model("Product", productSchema);

// export default Product;


import mongoose from "mongoose";

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
  { _id: false }
);

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
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

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
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    model: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
    },

    unit: {
      type: String,
      default: "Piece",
      trim: true,
    },

    images: [
      {
        type: String,
      },
    ],

    specifications: [specificationSchema],

    customFields: [customFieldSchema],

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    location: {
      city: String,
      state: String,
      country: {
        type: String,
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

const Product = mongoose.model(
  "Product",
  productSchema
);

export default Product;