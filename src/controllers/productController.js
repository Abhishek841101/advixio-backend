import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import XLSX from "xlsx";
// ==========================================
// CREATE SLUG
// ==========================================

const createSlug = (text) => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ==========================================
// RESOLVE CATEGORY
// ==========================================
// Frontend can send:
// "industrial-machinery"
// OR MongoDB ObjectId
//
// If category slug does not exist,
// it will automatically create Category.
// ==========================================

const resolveCategory = async (categoryValue) => {
  if (!categoryValue) {
    throw new Error("Category is required");
  }

  const value = String(categoryValue).trim();

  // ------------------------------------------
  // 1. Try MongoDB ObjectId
  // ------------------------------------------

  if (mongoose.Types.ObjectId.isValid(value)) {
    const categoryById =
      await Category.findById(value);

    if (categoryById) {
      return categoryById;
    }
  }

  // ------------------------------------------
  // 2. Try category slug
  // ------------------------------------------

  const slug = createSlug(value);

  let category =
    await Category.findOne({ slug });

  // ------------------------------------------
  // 3. Automatically create category
  // ------------------------------------------

  if (!category) {
    const categoryName = value
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );

    try {
      category =
        await Category.create({
          name: categoryName,
          slug,
          description:
            `${categoryName} products`,
          image: "",
          icon: "",
          isActive: true,
          sortOrder: 0,
        });

      console.log(
        "NEW CATEGORY CREATED:",
        category.name
      );

      console.log(
        "NEW CATEGORY ID:",
        category._id
      );

    } catch (error) {

      // Handle duplicate category creation
      // in case two requests arrive together.

      if (error.code === 11000) {
        category =
          await Category.findOne({ slug });

        if (!category) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  return category;
};

// ==========================================
// PARSE ARRAY FIELD
// ==========================================

const parseArrayField = (
  field,
  fieldName
) => {

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

      const parsed =
        JSON.parse(field);

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

const cleanSpecifications = (
  specifications
) => {

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
      label:
        String(item.label).trim(),

      value:
        String(item.value).trim(),
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

const cleanCustomFields = (
  customFields
) => {

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
      name:
        String(item.name).trim(),

      value:
        String(item.value).trim(),
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
    console.log("FILES:", req.files?.length || 0);

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
    // DEBUG CUSTOM FIELDS
    // ==========================================

    console.log("\n========== CUSTOM FIELDS RAW ==========");
    console.log("customFields:", customFields);
    console.log("typeof customFields:", typeof customFields);
    console.log("Array.isArray:", Array.isArray(customFields));

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    const cleanName = String(name ?? "")
      .trim()
      .replace(/\s+/g, " ");

    if (!cleanName) {
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

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ==========================================
    // NORMALIZED NAME + DUPLICATE CHECK
    // ==========================================

    const normalizedName = cleanName.toLowerCase();

    const duplicateProduct = await Product.findOne({
      normalizedName,
    }).select("_id name");

    if (duplicateProduct) {
      return res.status(409).json({
        success: false,
        message:
          "Product name already exists. Please use a unique product name.",
      });
    }

    // ==========================================
    // CATEGORY RESOLVE
    // ==========================================

    let categoryExists;

    try {
      categoryExists = await resolveCategory(category);
    } catch (error) {
      console.error("CATEGORY ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to resolve category",
      });
    }

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    console.log("CATEGORY NAME:", categoryExists.name);
    console.log("CATEGORY ID:", categoryExists._id);
    console.log("CATEGORY SLUG:", categoryExists.slug);

    // ==========================================
    // IMAGES
    // ==========================================

    const uploadedFiles = req.files || [];
console.log("========== UPDATE IMAGE DEBUG ==========");
console.log("FILES COUNT:", uploadedFiles.length);

uploadedFiles.forEach((file, index) => {
  console.log(`FILE ${index}:`, {
    originalname: file.originalname,
    mimetype: file.mimetype,
    path: file.path,
    hasBuffer: !!file.buffer,
    size: file.size,
    keys: Object.keys(file),
  });
});

console.log("IMAGE MANIFEST:", req.body.imageManifest);
    if (uploadedFiles.length > 3) {
      return res.status(400).json({
        success: false,
        message: "You can upload maximum 3 images",
      });
    }

    const imageUrls = uploadedFiles
      .map((file) => file.path)
      .filter(Boolean);

    if (imageUrls.length !== uploadedFiles.length) {
      return res.status(400).json({
        success: false,
        message: "One or more uploaded images are invalid",
      });
    }

    // ==========================================
    // UNIQUE SEO SLUG
    // ==========================================

    const baseSlug = createSlug(cleanName);

    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        message: "Unable to generate product URL from this name",
      });
    }

    let slug = baseSlug;
    let slugAttempt = 0;

    // Check for an existing slug.
    // The database unique index remains the final protection
    // against concurrent requests.
    while (await Product.exists({ slug })) {
      slugAttempt += 1;

      slug = `${baseSlug}-${Date.now()}-${slugAttempt}`;
    }

    // ==========================================
    // LOCATION
    // ==========================================

    let productLocation = {
      city: req.user?.city || "",
      state: req.user?.state || "",
      country: "India",
    };

    if (location !== undefined && location !== null && location !== "") {
      try {
        const parsedLocation =
          typeof location === "string"
            ? JSON.parse(location)
            : location;

        if (
          typeof parsedLocation !== "object" ||
          Array.isArray(parsedLocation)
        ) {
          return res.status(400).json({
            success: false,
            message: "Location must be a valid object",
          });
        }

        productLocation = {
          city: parsedLocation.city || "",
          state: parsedLocation.state || "",
          country: parsedLocation.country || "India",
        };
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
      parsedSpecifications = parseArrayField(
        specifications,
        "Specifications"
      );

      parsedSpecifications = cleanSpecifications(
        parsedSpecifications
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Invalid specifications",
      });
    }

    // ==========================================
    // CUSTOM FIELDS
    // ==========================================

    let parsedCustomFields = [];

    try {
      parsedCustomFields = parseArrayField(
        customFields,
        "Custom fields"
      );

      parsedCustomFields = cleanCustomFields(
        parsedCustomFields
      );
    } catch (error) {
      console.error("CUSTOM FIELD PARSE ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Invalid custom fields",
      });
    }

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

      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid non-negative number",
        });
      }
    }

    // ==========================================
    // PRODUCT DATA
    // ==========================================

    const productData = {
      name: cleanName,
      normalizedName,
      slug,

      shortDescription:
        typeof shortDescription === "string"
          ? shortDescription.trim()
          : "",

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      category: categoryExists._id,

      subcategory:
        typeof subcategory === "string"
          ? subcategory.trim()
          : "",

      brand:
        typeof brand === "string"
          ? brand.trim()
          : "",

      model:
        typeof model === "string"
          ? model.trim()
          : "",

      price: parsedPrice,

      unit:
        typeof unit === "string" && unit.trim()
          ? unit.trim()
          : "Piece",

      images: imageUrls,

      specifications: parsedSpecifications,

      customFields: parsedCustomFields,

      seller: req.user._id,

      companyName:
        (typeof companyName === "string"
          ? companyName.trim()
          : "") ||
        req.user?.companyName ||
        "",

      location: productLocation,
    };

    console.log("\n========== PRODUCT DATA BEFORE CREATE ==========");
    console.log(JSON.stringify(productData, null, 2));

    // ==========================================
    // CREATE PRODUCT
    // ==========================================

    const product = await Product.create(productData);

    console.log("PRODUCT CREATED:", product._id);

    // ==========================================
    // FETCH SAVED PRODUCT
    // ==========================================

    const savedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate(
        "seller",
        "name email phone companyName city state"
      );

    if (!savedProduct) {
      return res.status(500).json({
        success: false,
        message: "Product was created but could not be fetched",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    const responseProduct = savedProduct.toObject();

    responseProduct.customFields =
      responseProduct.customFields || [];

    responseProduct.specifications =
      responseProduct.specifications || [];

    responseProduct.images =
      responseProduct.images || [];

    return res.status(201).json({
      success: true,
      message: "Product listed successfully",
      data: responseProduct,
    });
  } catch (error) {
    console.error("\n========================================");
    console.error("CREATE PRODUCT ERROR");
    console.error("========================================");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error(error);

    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================

    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      let message = "A duplicate value already exists.";

      if (duplicateField === "normalizedName") {
        message =
          "Product name already exists. Please use a unique product name.";
      } else if (duplicateField === "slug") {
        message =
          "Product URL conflict. Please try creating the product again.";
      }

      return res.status(409).json({
        success: false,
        message,
      });
    }

    // ==========================================
    // VALIDATION ERROR
    // ==========================================

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // ==========================================
    // SERVER ERROR
    // ==========================================

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

export const getMyProducts = async (
  req,
  res
) => {

  try {

    const products =
      await Product.find({
        seller:
          req.user._id,
      })
        .populate(
          "category",
          "name slug"
        )
        .populate(
  "seller",
  "name email phone companyName city state"
)
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({

      success: true,

      count:
        products.length,

      data:
        products,
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
        status:
          "active",
      })
        .populate(
          "category",
          "name slug"
        )
        .populate(
  "seller",
  "name email phone companyName city state"
)
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({

      success: true,

      count:
        products.length,

      data:
        products,
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

export const getProductBySlug =
  async (
    req,
    res
  ) => {

    try {

      const product =
        await Product.findOne({
          slug:
            req.params.slug,

          status:
            "active",
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

          message:
            "Product not found",
        });
      }

      return res.status(200).json({

        success: true,

        data:
          product,
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


export const updateProduct = async (req, res) => {
  try {
    console.log("\n========================================");
    console.log("UPDATE PRODUCT");
    console.log("========================================");
    console.log("Product ID:", req.params.id);
    console.log("BODY:", req.body);
    console.log("FILES:", req.files?.length || 0);

    // ==========================================
    // FIND PRODUCT
    // ==========================================

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ==========================================
    // OWNER CHECK
    // ==========================================

    if (
      !product.seller ||
      product.seller.toString() !== req.user?._id?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own products",
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
    // NAME + NORMALIZED NAME
    // ==========================================

    if (name !== undefined) {
      const cleanName = String(name)
        .trim()
        .replace(/\s+/g, " ");

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Product name is required",
        });
      }

      const normalizedName = cleanName.toLowerCase();

      // Prevent duplicate names, ignoring case and extra spaces.
      const duplicateProduct = await Product.findOne({
        normalizedName,
        _id: { $ne: product._id },
      }).select("_id name");

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message:
            "Product name already exists. Please use a unique product name.",
        });
      }

      product.name = cleanName;
      product.normalizedName = normalizedName;
    } else if (!product.normalizedName && product.name) {
      // Backward compatibility for records created before this field.
      product.normalizedName = String(product.name)
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
    }

    // IMPORTANT:
    // Keep product.slug unchanged during an edit.
    // This preserves the existing product URL.

    // ==========================================
    // SHORT DESCRIPTION
    // ==========================================

    if (shortDescription !== undefined) {
      product.shortDescription =
        typeof shortDescription === "string"
          ? shortDescription.trim()
          : "";
    }

    // ==========================================
    // DESCRIPTION
    // ==========================================

    if (description !== undefined) {
      product.description =
        typeof description === "string"
          ? description.trim()
          : "";
    }

    // ==========================================
    // CATEGORY
    // ==========================================

    if (category !== undefined) {
      try {
        const categoryExists = await resolveCategory(category);

        if (!categoryExists) {
          return res.status(400).json({
            success: false,
            message: "Invalid category",
          });
        }

        product.category = categoryExists._id;

        console.log("UPDATED CATEGORY:", categoryExists.name);
        console.log("UPDATED CATEGORY ID:", categoryExists._id);
        console.log("UPDATED CATEGORY SLUG:", categoryExists.slug);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Failed to update category",
        });
      }
    }

    // ==========================================
    // SUBCATEGORY
    // ==========================================

    if (subcategory !== undefined) {
      product.subcategory =
        typeof subcategory === "string"
          ? subcategory.trim()
          : "";
    }

    // ==========================================
    // BRAND
    // ==========================================

    if (brand !== undefined) {
      product.brand =
        typeof brand === "string" ? brand.trim() : "";
    }

    // ==========================================
    // MODEL
    // ==========================================

    if (model !== undefined) {
      product.model =
        typeof model === "string" ? model.trim() : "";
    }

    // ==========================================
    // PRICE
    // ==========================================

    if (price !== undefined) {
      if (price === "" || price === null) {
        product.price = undefined;
      } else {
        const parsedPrice = Number(price);

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({
            success: false,
            message: "Price must be a valid non-negative number",
          });
        }

        product.price = parsedPrice;
      }
    }

    // ==========================================
    // UNIT
    // ==========================================

    if (unit !== undefined) {
      product.unit =
        typeof unit === "string" && unit.trim()
          ? unit.trim()
          : "Piece";
    }

    // ==========================================
    // COMPANY NAME
    // ==========================================

    if (companyName !== undefined) {
      product.companyName =
        typeof companyName === "string"
          ? companyName.trim()
          : "";
    }

    // ==========================================
    // SPECIFICATIONS
    // ==========================================

    if (req.body.specifications !== undefined) {
      try {
        let specifications = parseArrayField(
          req.body.specifications,
          "Specifications"
        );

        specifications = cleanSpecifications(specifications);
        product.specifications = specifications;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Invalid specifications",
        });
      }
    }

    // ==========================================
    // CUSTOM FIELDS
    // ==========================================

    if (req.body.customFields !== undefined) {
      try {
        let customFields = parseArrayField(
          req.body.customFields,
          "Custom fields"
        );

        customFields = cleanCustomFields(customFields);
        product.customFields = customFields;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Invalid custom fields",
        });
      }
    }

    // ==========================================
    // LOCATION
    // ==========================================

    if (location !== undefined) {
      try {
        const parsedLocation =
          typeof location === "string"
            ? JSON.parse(location)
            : location;

        if (
          parsedLocation !== null &&
          (typeof parsedLocation !== "object" ||
            Array.isArray(parsedLocation))
        ) {
          return res.status(400).json({
            success: false,
            message: "Location must be a valid object",
          });
        }

        product.location = parsedLocation;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid location data",
        });
      }
    }

    // ==========================================
    // IMAGES
    // ==========================================

    // ==========================================
// IMAGES
// Existing images + new uploaded images
// ==========================================

// ==========================================
// IMAGES
// Existing images + new uploaded images
// ==========================================

if (req.body.imageManifest !== undefined) {
  try {
    const imageManifest =
      typeof req.body.imageManifest === "string"
        ? JSON.parse(req.body.imageManifest)
        : req.body.imageManifest;

    if (!Array.isArray(imageManifest)) {
      throw new Error("Invalid image manifest");
    }

    const uploadedFiles = req.files || [];

    const existingProductImages = Array.isArray(product.images)
      ? product.images
      : [];

    if (imageManifest.length > 10) {
      throw new Error("Maximum 10 product images allowed");
    }

    const finalImages = [];
    const referencedFileIndexes = [];

    for (const item of imageManifest) {
      if (!item || typeof item !== "object") {
        throw new Error("Invalid image entry");
      }

      // EXISTING IMAGE
      if (item.type === "existing") {
        if (
          typeof item.url !== "string" ||
          !existingProductImages.includes(item.url)
        ) {
          throw new Error("Invalid existing product image");
        }

        finalImages.push(item.url);
        continue;
      }

      // NEW IMAGE
      if (item.type === "new") {
        const fileIndex = Number(item.fileIndex);

        if (
          !Number.isInteger(fileIndex) ||
          fileIndex < 0 ||
          fileIndex >= uploadedFiles.length
        ) {
          throw new Error("Invalid uploaded image reference");
        }

        if (referencedFileIndexes.includes(fileIndex)) {
          throw new Error("Duplicate uploaded image reference");
        }

        const uploadedImage = uploadedFiles[fileIndex];

        // Same upload result format as Create Product
        if (
          !uploadedImage ||
          !uploadedImage.path ||
          !uploadedImage.mimetype?.startsWith("image/")
        ) {
          throw new Error("Uploaded image is invalid");
        }

        referencedFileIndexes.push(fileIndex);

        // Save uploaded image URL
        finalImages.push(uploadedImage.path);
        continue;
      }

      throw new Error("Unknown image type");
    }

    if (referencedFileIndexes.length !== uploadedFiles.length) {
      throw new Error(
        "Image upload data does not match image manifest"
      );
    }

    product.images = finalImages;

    console.log("UPDATED PRODUCT IMAGES:", product.images);
  } catch (error) {
    console.error("IMAGE UPDATE ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid image update data",
    });
  }
}
    // ==========================================
    // SAVE
    // ==========================================

    await product.save();

    // ==========================================
    // FETCH UPDATED PRODUCT
    // ==========================================

    const updatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate(
        "seller",
        "name email phone companyName city state"
      );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product was updated but could not be fetched",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    const responseProduct = updatedProduct.toObject();

    responseProduct.customFields =
      responseProduct.customFields || [];

    responseProduct.specifications =
      responseProduct.specifications || [];

    responseProduct.images =
      responseProduct.images || [];

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: responseProduct,
    });
  } catch (error) {
    console.error("\nUPDATE PRODUCT ERROR:");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    console.error(error);

    // MongoDB duplicate-key protection.
    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      const message =
        duplicateField === "normalizedName"
          ? "Product name already exists. Please use a unique product name."
          : duplicateField === "slug"
            ? "This product URL already exists."
            : "A duplicate value already exists.";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    // Mongoose validation errors.
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};


// ==========================================
// DELETE PRODUCT
// ==========================================

export const deleteProduct =
  async (
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
  async (
    req,
    res
  ) => {

    try {

      const {
        slug,
      } = req.params;

      const category =
        await Category.findOne({

          slug:
            slug.toLowerCase(),

          isActive:
            true,
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

          status:
            "active",
        })
          .populate(
  "seller",
  "name email phone companyName city state"
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

        count:
          products.length,

        data:
          products,
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
  // ==========================================
// BULK EXCEL PRODUCT UPLOAD
// ==========================================

const normalizeExcelHeader = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const parseExcelPairs = (value, fieldName) => {
  if (!value) return [];

  // JSON format is also supported
  if (typeof value === "string" && value.trim().startsWith("[")) {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error(`Invalid ${fieldName}`);
    }

    return fieldName === "Specifications"
      ? cleanSpecifications(parsed)
      : cleanCustomFields(parsed);
  }

  const entries = String(value)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  return entries
    .map((entry) => {
      const separatorIndex = entry.indexOf("=");

      if (separatorIndex === -1) {
        throw new Error(
          `Invalid ${fieldName} format: ${entry}. Use Name=Value`
        );
      }

      const label = entry.slice(0, separatorIndex).trim();
      const val = entry.slice(separatorIndex + 1).trim();

      if (!label || !val) {
        throw new Error(`Invalid ${fieldName} entry: ${entry}`);
      }

      return fieldName === "Specifications"
        ? { label, value: val }
        : { name: label, value: val };
    });
};

export const bulkUploadProducts = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file",
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        success: false,
        message: "Excel sheet is empty",
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    const rows = rawRows.filter((row) =>
      Object.values(row).some(
        (value) => String(value).trim() !== ""
      )
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "No product data found in Excel",
      });
    }

    if (rows.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Maximum 500 products can be uploaded at once",
      });
    }

    const results = [];
    const uploadedNames = new Set();

    let createdCount = 0;
    let failedCount = 0;

    for (let index = 0; index < rows.length; index++) {
      const excelRowNumber = index + 2;

      try {
        const row = {};

        // Normalize Excel column names
        Object.entries(rows[index]).forEach(([key, value]) => {
          row[normalizeExcelHeader(key)] = value;
        });

        const getValue = (...keys) => {
          for (const key of keys) {
            const value = row[normalizeExcelHeader(key)];

            if (value !== undefined && value !== null) {
              return String(value).trim();
            }
          }

          return "";
        };

        const name = getValue("Product Name", "Name");
        const category = getValue("Category");

        if (!name) {
          throw new Error("Product Name is required");
        }

        if (!category) {
          throw new Error("Category is required");
        }

        const cleanName = name.replace(/\s+/g, " ");
        const normalizedName = cleanName.toLowerCase();

        // Duplicate within the same Excel file
        if (uploadedNames.has(normalizedName)) {
          throw new Error("Duplicate product name in Excel file");
        }

        // Duplicate in existing database
        const existingProduct = await Product.findOne({
          normalizedName,
        }).select("_id");

        if (existingProduct) {
          throw new Error("Product name already exists");
        }

        const categoryExists = await resolveCategory(category);

        if (!categoryExists) {
          throw new Error("Invalid category");
        }

        // Price
        const priceValue = getValue("Price");
        let parsedPrice;

        if (priceValue !== "") {
          parsedPrice = Number(priceValue);

          if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            throw new Error("Invalid price");
          }
        }

        // Specifications
        const specifications = parseExcelPairs(
          getValue("Specifications"),
          "Specifications"
        );

        // Custom Fields
        const customFields = parseExcelPairs(
          getValue("Custom Fields"),
          "Custom Fields"
        );

        // Slug
        const baseSlug = createSlug(cleanName);

        if (!baseSlug) {
          throw new Error("Unable to generate product URL");
        }

        let slug = baseSlug;
        let slugAttempt = 0;

        while (await Product.exists({ slug })) {
          slugAttempt++;
          slug = `${baseSlug}-${Date.now()}-${slugAttempt}`;
        }

        const productData = {
          name: cleanName,
          normalizedName,
          slug,

          shortDescription: getValue("Short Description"),
          description: getValue("Description"),

          category: categoryExists._id,

          subcategory: getValue("Subcategory"),
          brand: getValue("Brand"),
          model: getValue("Model"),

          price: parsedPrice,

          unit: getValue("Unit") || "Piece",

          // Images are optional
          images: [],

          specifications,
          customFields,

          seller: req.user._id,

          companyName: req.user.companyName || "",

          location: {
            city: req.user.city || "",
            state: req.user.state || "",
            country: "India",
          },
        };

        const product = await Product.create(productData);

        uploadedNames.add(normalizedName);
        createdCount++;

        results.push({
          row: excelRowNumber,
          name: cleanName,
          success: true,
          productId: product._id,
        });

      } catch (error) {
        failedCount++;

        results.push({
          row: excelRowNumber,
          name: String(
            rows[index]["Product Name"] ||
            rows[index]["Name"] ||
            ""
          ),
          success: false,
          message:
            error.code === 11000
              ? "Duplicate product name or URL"
              : error.message || "Failed to create product",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk product upload completed",
      summary: {
        total: rows.length,
        created: createdCount,
        failed: failedCount,
      },
      results,
    });

  } catch (error) {
    console.error("BULK PRODUCT UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process Excel file",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};