import Product from "../models/Product.js";
import Category from "../models/Category.js";

// ==========================================
// CREATE SLUG
// ==========================================

const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ==========================================
// PARSE ARRAY FIELD
// ==========================================

const parseArrayField = (field, fieldName) => {
  if (
    field === undefined ||
    field === null ||
    field === ""
  ) {
    return [];
  }

  if (Array.isArray(field)) {
    return field;
  }

  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);

      if (!Array.isArray(parsed)) {
        throw new Error(
          `${fieldName} must be an array`
        );
      }

      return parsed;
    } catch (error) {
      throw new Error(
        `Invalid ${fieldName.toLowerCase()} format`
      );
    }
  }

  throw new Error(
    `${fieldName} must be an array`
  );
};

// ==========================================
// CLEAN SPECIFICATIONS
// ==========================================

const cleanSpecifications = (specifications) => {
  if (!Array.isArray(specifications)) {
    return [];
  }

  return specifications
    .filter((item) => {
      return (
        item &&
        typeof item === "object" &&
        item.label !== undefined &&
        item.value !== undefined
      );
    })
    .map((item) => ({
      label: String(item.label).trim(),
      value: String(item.value).trim(),
    }))
    .filter((item) => {
      return (
        item.label !== "" &&
        item.value !== ""
      );
    });
};

// ==========================================
// CLEAN CUSTOM FIELDS
// ==========================================

const cleanCustomFields = (customFields) => {
  if (!Array.isArray(customFields)) {
    return [];
  }

  return customFields
    .filter((item) => {
      return (
        item &&
        typeof item === "object" &&
        item.name !== undefined &&
        item.value !== undefined
      );
    })
    .map((item) => ({
      name: String(item.name).trim(),
      value: String(item.value).trim(),
    }))
    .filter((item) => {
      return (
        item.name !== "" &&
        item.value !== ""
      );
    });
};

// ==========================================
// CREATE PRODUCT
// ==========================================

export const createProduct = async (req, res) => {
  try {
    console.log("\n========================================");
    console.log("CREATE PRODUCT");
    console.log("========================================");

    console.log("BODY:", req.body);

    console.log(
      "FILES:",
      req.files?.length || 0
    );

    // ==========================================
    // BODY
    // ==========================================

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
      customFields,
      companyName,
      location,
    } = req.body;

    // ==========================================
    // CUSTOM FIELD RAW DEBUG
    // ==========================================

    console.log(
      "\n========== CUSTOM FIELDS RAW =========="
    );

    console.log(
      "customFields:",
      customFields
    );

    console.log(
      "typeof customFields:",
      typeof customFields
    );

    console.log(
      "Array.isArray:",
      Array.isArray(customFields)
    );

    // ==========================================
    // BASIC VALIDATION
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
    // CATEGORY CHECK
    // ==========================================

    const categoryExists =
      await Category.findById(category);

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    // ==========================================
    // IMAGES
    // ==========================================

    const imageUrls = req.files
      ? req.files.map((file) => file.path)
      : [];

    if (imageUrls.length > 3) {
      return res.status(400).json({
        success: false,
        message:
          "You can upload maximum 3 images",
      });
    }

    // ==========================================
    // SLUG
    // ==========================================

    let slug = createSlug(name);

    const existingProduct =
      await Product.findOne({ slug });

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

    try {
      parsedSpecifications =
        parseArrayField(
          specifications,
          "Specifications"
        );

      parsedSpecifications =
        cleanSpecifications(
          parsedSpecifications
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // ==========================================
    // CUSTOM FIELDS
    // ==========================================

    let parsedCustomFields = [];

    try {
      parsedCustomFields =
        parseArrayField(
          customFields,
          "Custom fields"
        );

      parsedCustomFields =
        cleanCustomFields(
          parsedCustomFields
        );
    } catch (error) {
      console.error(
        "CUSTOM FIELD PARSE ERROR:",
        error
      );

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // ==========================================
    // CUSTOM FIELD DEBUG
    // ==========================================

    console.log(
      "\n========== CUSTOM FIELDS AFTER PARSE =========="
    );

    console.log(
      "parsedCustomFields:",
      parsedCustomFields
    );

    console.log(
      "parsedCustomFields JSON:",
      JSON.stringify(
        parsedCustomFields,
        null,
        2
      )
    );

    console.log(
      "CUSTOM FIELD COUNT:",
      parsedCustomFields.length
    );

    // ==========================================
    // PRICE
    // ==========================================

    let parsedPrice;

    if (
      price !== undefined &&
      price !== null &&
      price !== ""
    ) {
      parsedPrice = Number(price);

      if (Number.isNaN(parsedPrice)) {
        return res.status(400).json({
          success: false,
          message: "Invalid price",
        });
      }
    }

    // ==========================================
    // PRODUCT DATA
    // ==========================================

    const productData = {
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

      price: parsedPrice,

      unit:
        unit?.trim() || "Piece",

      images: imageUrls,

      specifications:
        parsedSpecifications,

      customFields:
        parsedCustomFields,

      seller: req.user._id,

      companyName:
        companyName?.trim() ||
        req.user?.companyName ||
        "",

      location: {
        city:
          productLocation.city || "",

        state:
          productLocation.state || "",

        country:
          productLocation.country ||
          "India",
      },
    };

    // ==========================================
    // FINAL PRODUCT DATA DEBUG
    // ==========================================

    console.log(
      "\n========== PRODUCT DATA BEFORE CREATE =========="
    );

    console.log(
      "productData.customFields:",
      productData.customFields
    );

    console.log(
      "productData.customFields length:",
      productData.customFields?.length
    );

    console.log(
      "FULL PRODUCT DATA:",
      JSON.stringify(
        productData,
        null,
        2
      )
    );

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    const product =
      await Product.create(productData);

    // ==========================================
    // MONGOOSE RESULT
    // ==========================================

    console.log(
      "\n========== AFTER MONGOOSE CREATE =========="
    );

    console.log(
      "PRODUCT ID:",
      product._id
    );

    console.log(
      "MONGOOSE customFields:",
      product.customFields
    );

    console.log(
      "MONGOOSE customFields COUNT:",
      product.customFields?.length
    );

    console.log(
      "MONGOOSE PRODUCT:",
      product.toObject()
    );

    // ==========================================
    // DATABASE CHECK
    // ==========================================

    const savedProduct =
      await Product.findById(
        product._id
      ).lean();

    console.log(
      "\n========== DATABASE CHECK =========="
    );

    console.log(
      "DB customFields:",
      savedProduct?.customFields
    );

    console.log(
      "DB customFields COUNT:",
      savedProduct?.customFields?.length
    );

    console.log(
      "DB specifications:",
      savedProduct?.specifications
    );

    // ==========================================
    // POPULATE
    // ==========================================

    const populatedProduct =
      await Product.findById(
        product._id
      )
        .populate(
          "category",
          "name slug"
        )
        .populate(
          "seller",
          "name email phone companyName city state"
        );

    // ==========================================
    // FINAL RESPONSE DEBUG
    // ==========================================

    console.log(
      "\n========== FINAL RESPONSE =========="
    );

    console.log(
      "POPULATED customFields:",
      populatedProduct?.customFields
    );

    console.log(
      "POPULATED customFields COUNT:",
      populatedProduct?.customFields?.length
    );

    console.log(
      "POPULATED specifications:",
      populatedProduct?.specifications
    );

    // ==========================================
    // FINAL API RESPONSE
    // ==========================================

    const responseProduct =
      populatedProduct.toObject();

    // IMPORTANT:
    // Explicitly force customFields
    responseProduct.customFields =
      savedProduct?.customFields || [];

    console.log(
      "\n========== RESPONSE CUSTOM FIELDS =========="
    );

    console.log(
      responseProduct.customFields
    );

    console.log(
      "RESPONSE CUSTOM FIELD COUNT:",
      responseProduct.customFields.length
    );

    return res.status(201).json({
      success: true,

      message:
        "Product listed successfully",

      data: responseProduct,
    });

  } catch (error) {
    console.error(
      "\n========================================"
    );

    console.error(
      "CREATE PRODUCT ERROR"
    );

    console.error(
      "========================================"
    );

    console.error(
      "Name:",
      error.name
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to create product",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// GET MY PRODUCTS
// ==========================================

export const getMyProducts = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        seller: req.user._id,
      })
        .populate(
          "category",
          "name slug"
        )
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
    console.error(
      "Get my products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch your products",
    });
  }
};

// ==========================================
// GET ALL PRODUCTS
// ==========================================

export const getProducts = async (
  req,
  res
) => {
  try {
    const products =
      await Product.find({
        status: "active",
      })
        .populate(
          "category",
          "name slug"
        )
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
    console.error(
      "Get products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch products",
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT BY SLUG
// ==========================================

export const getProductBySlug = async (
  req,
  res
) => {
  try {
    const product =
      await Product.findOne({
        slug: req.params.slug,
        status: "active",
      })
        .populate(
          "category",
          "name slug"
        )
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
    console.error(
      "Get product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch product",
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// ==========================================

export const updateProduct = async (
  req,
  res
) => {
  try {
    console.log(
      "\n========================================"
    );

    console.log(
      "UPDATE PRODUCT"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Product ID:",
      req.params.id
    );

    console.log(
      "BODY:",
      req.body
    );

    console.log(
      "FILES:",
      req.files?.length || 0
    );

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    // ==========================================
    // OWNER CHECK
    // ==========================================

    if (
      product.seller.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own products",
      });
    }

    // ==========================================
    // BASIC FIELDS
    // ==========================================

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
      companyName,
      location,
    } = req.body;

    // ==========================================
    // NAME
    // ==========================================

    if (
      name !== undefined
    ) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required",
        });
      }

      product.name =
        name.trim();

      let newSlug =
        createSlug(name);

      const existingSlug =
        await Product.findOne({
          slug: newSlug,
          _id: {
            $ne: product._id,
          },
        });

      if (existingSlug) {
        newSlug =
          `${newSlug}-${Date.now()}`;
      }

      product.slug =
        newSlug;
    }

    // ==========================================
    // OTHER BASIC FIELDS
    // ==========================================

    if (
      shortDescription !== undefined
    ) {
      product.shortDescription =
        shortDescription?.trim() || "";
    }

    if (
      description !== undefined
    ) {
      product.description =
        description?.trim() || "";
    }

    // ==========================================
    // CATEGORY
    // ==========================================

    if (
      category !== undefined
    ) {
      const categoryExists =
        await Category.findById(
          category
        );

      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category",
        });
      }

      product.category =
        category;
    }

    // ==========================================
    // SUBCATEGORY
    // ==========================================

    if (
      subcategory !== undefined
    ) {
      product.subcategory =
        subcategory?.trim() || "";
    }

    // ==========================================
    // BRAND
    // ==========================================

    if (
      brand !== undefined
    ) {
      product.brand =
        brand?.trim() || "";
    }

    // ==========================================
    // MODEL
    // ==========================================

    if (
      model !== undefined
    ) {
      product.model =
        model?.trim() || "";
    }

    // ==========================================
    // PRICE
    // ==========================================

    if (
      price !== undefined
    ) {
      if (
        price === "" ||
        price === null
      ) {
        product.price =
          undefined;
      } else {
        const parsedPrice =
          Number(price);

        if (
          Number.isNaN(
            parsedPrice
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid price",
          });
        }

        product.price =
          parsedPrice;
      }
    }

    // ==========================================
    // UNIT
    // ==========================================

    if (
      unit !== undefined
    ) {
      product.unit =
        unit?.trim() || "Piece";
    }

    // ==========================================
    // COMPANY NAME
    // ==========================================

    if (
      companyName !== undefined
    ) {
      product.companyName =
        companyName?.trim() || "";
    }

    // ==========================================
    // SPECIFICATIONS
    // ==========================================

    if (
      req.body.specifications !==
      undefined
    ) {
      try {
        let specifications =
          parseArrayField(
            req.body.specifications,
            "Specifications"
          );

        specifications =
          cleanSpecifications(
            specifications
          );

        product.specifications =
          specifications;

        console.log(
          "UPDATED SPECIFICATIONS:",
          specifications
        );

      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            error.message,
        });
      }
    }

    // ==========================================
    // CUSTOM FIELDS
    // ==========================================

    if (
      req.body.customFields !==
      undefined
    ) {
      console.log(
        "\n========== UPDATE CUSTOM FIELDS =========="
      );

      console.log(
        "RAW UPDATE CUSTOM FIELDS:",
        req.body.customFields
      );

      console.log(
        "RAW TYPE:",
        typeof req.body.customFields
      );

      try {
        let customFields =
          parseArrayField(
            req.body.customFields,
            "Custom fields"
          );

        customFields =
          cleanCustomFields(
            customFields
          );

        product.customFields =
          customFields;

        console.log(
          "UPDATED CUSTOM FIELDS:",
          customFields
        );

        console.log(
          "UPDATED CUSTOM FIELD COUNT:",
          customFields.length
        );

      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            error.message,
        });
      }
    }

    // ==========================================
    // LOCATION
    // ==========================================

    if (
      location !== undefined
    ) {
      try {
        product.location =
          typeof location ===
          "string"
            ? JSON.parse(location)
            : location;

      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid location data",
        });
      }
    }

    // ==========================================
    // IMAGES
    // ==========================================

    if (
      req.files &&
      req.files.length > 0
    ) {
      const newImages =
        req.files.map(
          (file) => file.path
        );

      if (
        newImages.length > 3
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You can upload maximum 3 images",
        });
      }

      product.images =
        newImages;
    }

    // ==========================================
    // DEBUG BEFORE SAVE
    // ==========================================

    console.log(
      "\n========== BEFORE UPDATE SAVE =========="
    );

    console.log(
      "Specifications:",
      product.specifications
    );

    console.log(
      "Custom Fields:",
      product.customFields
    );

    console.log(
      "Custom Field Count:",
      product.customFields?.length
    );

    // ==========================================
    // SAVE
    // ==========================================

    await product.save();

    // ==========================================
    // DATABASE CHECK
    // ==========================================

    const savedProduct =
      await Product.findById(
        product._id
      ).lean();

    console.log(
      "\n========== AFTER UPDATE =========="
    );

    console.log(
      "DB specifications:",
      savedProduct?.specifications
    );

    console.log(
      "DB customFields:",
      savedProduct?.customFields
    );

    console.log(
      "DB customFields COUNT:",
      savedProduct?.customFields?.length
    );

    // ==========================================
    // POPULATE
    // ==========================================

    const updatedProduct =
      await Product.findById(
        product._id
      )
        .populate(
          "category",
          "name slug"
        )
        .populate(
          "seller",
          "name email phone companyName city state"
        );

    // ==========================================
    // RESPONSE
    // ==========================================

    const responseProduct =
      updatedProduct.toObject();

    responseProduct.customFields =
      savedProduct?.customFields || [];

    return res.status(200).json({
      success: true,

      message:
        "Product updated successfully",

      data: responseProduct,
    });

  } catch (error) {
    console.error(
      "\nUPDATE PRODUCT ERROR:"
    );

    console.error(
      "Name:",
      error.name
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to update product",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// DELETE PRODUCT
// ==========================================

export const deleteProduct = async (
  req,
  res
) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    if (
      product.seller.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own products",
      });
    }

    await Product.findByIdAndDelete(
      product._id
    );

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete product",
    });
  }
};

// ==========================================
// GET PRODUCTS BY CATEGORY SLUG
// ==========================================

export const getProductsByCategorySlug =
  async (req, res) => {
    try {
      const { slug } =
        req.params;

      const category =
        await Category.findOne({
          slug:
            slug.toLowerCase(),
          isActive: true,
        });

      if (!category) {
        return res.status(404).json({
          success: false,
          message:
            "Category not found",
        });
      }

      const products =
        await Product.find({
          category:
            category._id,
          status: "active",
        })
          .populate(
            "seller",
            "name email companyName"
          )
          .populate(
            "category",
            "name slug"
          )
          .sort({
            createdAt: -1,
          })
          .limit(50);

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });

    } catch (error) {
      console.error(
        "Get products by category slug error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch category products",
      });
    }
  };