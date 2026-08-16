import Product from "../models/Product.js";
import Category from "../models/Category.js";

const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};


// ==========================================
// CREATE PRODUCT
// ==========================================

// export const createProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       shortDescription,
//       description,
//       category,
//       subcategory,
//       brand,
//       model,
//       price,
//       unit,
//       images,
//       specifications,
//       companyName,
//       location,
//     } = req.body;

//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "Product name is required",
//       });
//     }

//     if (!category) {
//       return res.status(400).json({
//         success: false,
//         message: "Category is required",
//       });
//     }

//     const categoryExists = await Category.findById(category);

//     if (!categoryExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category",
//       });
//     }

//     let slug = createSlug(name);

//     const existingProduct = await Product.findOne({ slug });

//     if (existingProduct) {
//       slug = `${slug}-${Date.now()}`;
//     }

//     const product = await Product.create({
//       name,
//       slug,
//       shortDescription,
//       description,
//       category,
//       subcategory,
//       brand,
//       model,
//       price,
//       unit,
//       images: images || [],
//       specifications: specifications || [],

//       // IMPORTANT:
//       // Product owner = logged-in user
//       seller: req.user._id,

//       companyName: companyName || req.user.companyName,

//       location: location || {
//         city: req.user.city,
//         state: req.user.state,
//         country: "India",
//       },
//     });

//     const populatedProduct = await Product.findById(product._id)
//       .populate("category", "name slug")
//       .populate(
//         "seller",
//         "name email phone companyName city state"
//       );

//     return res.status(201).json({
//       success: true,
//       message: "Product listed successfully",
//       data: populatedProduct,
//     });
//   } catch (error) {
//     console.error("Create product error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create product",
//     });
//   }
// };



export const createProduct = async (req, res) => {
  try {
    const {
      name,
      shortDescription,
      description,
      category,
      subcategory,
      brand,
      model,
      price,
      unit,
      specifications,
      companyName,
      location,
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // ==========================================
    // CHECK CATEGORY
    // ==========================================

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // ==========================================
    // GET CLOUDINARY IMAGE URLS
    // ==========================================

    const imageUrls = req.files
      ? req.files.map((file) => file.path)
      : [];

    // Maximum 3 images
    if (imageUrls.length > 3) {
      return res.status(400).json({
        success: false,
        message: "You can upload maximum 3 images",
      });
    }

    // ==========================================
    // CREATE SLUG
    // ==========================================

    let slug = createSlug(name);

    const existingProduct = await Product.findOne({
      slug,
    });

    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }

    // ==========================================
    // LOCATION
    // ==========================================

    let productLocation = {
      city: req.user?.city || "",
      state: req.user?.state || "",
      country: "India",
    };

    if (location) {
      try {
        productLocation =
          typeof location === "string"
            ? JSON.parse(location)
            : location;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid location data",
        });
      }
    }

    // ==========================================
    // SPECIFICATIONS
    // ==========================================

    let parsedSpecifications = [];

    if (specifications !== undefined && specifications !== null) {
      try {
        if (typeof specifications === "string") {
          // Empty string
          if (!specifications.trim()) {
            parsedSpecifications = [];
          } else {
            parsedSpecifications = JSON.parse(specifications);
          }
        } else {
          parsedSpecifications = specifications;
        }
      } catch (error) {
        console.error(
          "Specifications parse error:",
          error
        );

        return res.status(400).json({
          success: false,
          message: "Invalid specifications format",
        });
      }
    }

    // ==========================================
    // VALIDATE SPECIFICATIONS ARRAY
    // ==========================================

    if (!Array.isArray(parsedSpecifications)) {
      return res.status(400).json({
        success: false,
        message: "Specifications must be an array",
      });
    }

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    const product = await Product.create({
      name: name.trim(),

      slug,

      shortDescription:
        shortDescription?.trim() || "",

      description:
        description?.trim() || "",

      category,

      subcategory:
        subcategory?.trim() || "",

      brand:
        brand?.trim() || "",

      model:
        model?.trim() || "",

      price:
        price !== undefined &&
        price !== ""
          ? Number(price)
          : undefined,

      unit:
        unit?.trim() || "Piece",

      // ========================================
      // CLOUDINARY IMAGES
      // ========================================

      images: imageUrls,

      // ========================================
      // IMPORTANT:
      // Use parsedSpecifications, NOT specifications
      // ========================================

      specifications: parsedSpecifications,

      // ========================================
      // PRODUCT OWNER
      // ========================================

      seller: req.user._id,

      // ========================================
      // BUSINESS INFORMATION
      // ========================================

      companyName:
        companyName?.trim() ||
        req.user?.companyName ||
        "",

      location: productLocation,
    });

    // ==========================================
    // POPULATE PRODUCT
    // ==========================================

    const populatedProduct =
      await Product.findById(product._id)
        .populate(
          "category",
          "name slug"
        )
        .populate(
          "seller",
          "name email phone companyName city state"
        );

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Product listed successfully",
      data: populatedProduct,
    });
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================

    console.error(
      "Create product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// GET MY PRODUCTS
// ==========================================

export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.user._id,
    })
      .populate("category", "name slug")
      .populate(
        "seller",
        "name companyName city state"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get my products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your products",
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// ==========================================

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      status: "active",
    })
      .populate("category", "name slug")
      .populate(
        "seller",
        "name companyName city state"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};


// ==========================================
// GET SINGLE PRODUCT
// ==========================================

export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      status: "active",
    })
      .populate("category", "name slug")
      .populate(
        "seller",
        "name email phone companyName city state"
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};


// ==========================================
// UPDATE PRODUCT
// ==========================================

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ONLY OWNER CAN EDIT
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own products",
      });
    }

    const allowedFields = [
      "name",
      "shortDescription",
      "description",
      "category",
      "subcategory",
      "brand",
      "model",
      "price",
      "unit",
      "images",
      "specifications",
      "companyName",
      "location",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate(
        "seller",
        "name email phone companyName city state"
      );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};


// ==========================================
// DELETE PRODUCT
// ==========================================

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ONLY OWNER CAN DELETE
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own products",
      });
    }

    await Product.findByIdAndDelete(product._id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

export const getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const products = await Product.find({
      category: category._id,
      status: "active",
    })
      .populate("seller", "name email companyName")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products by category slug error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category products",
    });
  }
};



