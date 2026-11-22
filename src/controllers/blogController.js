
import mongoose from "mongoose";
import Blog from "../models/Blog.js";

const LOG_PREFIX = "[BLOG CONTROLLER]";

const log = (...args) => console.log(LOG_PREFIX, ...args);

const logError = (message, error) => {
  console.error(LOG_PREFIX, message);
  console.error(LOG_PREFIX, "Error message:", error?.message || error);
  if (error?.stack) {
    console.error(LOG_PREFIX, "Stack:", error.stack);
  }
};

const normalizeString = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const makeSlug = (value) => {
  return normalizeString(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
};

const parseArray = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeString).filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.map(normalizeString).filter(Boolean);
    }
  } catch {
    // Allow comma-separated tags/keywords as well.
  }

  return value
    .split(",")
    .map(normalizeString)
    .filter(Boolean);
};

const parseObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
};

const getUploadedImages = (req) => {
  const files = req.files;

  if (Array.isArray(files)) {
    return files.filter((file) => file.fieldname === "images");
  }

  if (files && Array.isArray(files.images)) {
    return files.images;
  }

  return [];
};

const getUploadedVideo = (req) => {
  const files = req.files;

  if (Array.isArray(files)) {
    return files.find((file) => file.fieldname === "video") || null;
  }

  if (files && Array.isArray(files.video)) {
    return files.video[0] || null;
  }

  return null;
};

const getUploadedCover = (req) => {
  const files = req.files;

  if (Array.isArray(files)) {
    return files.find((file) => file.fieldname === "coverImage") || null;
  }

  if (files && Array.isArray(files.coverImage)) {
    return files.coverImage[0] || null;
  }

  return null;
};

const getCloudinaryUrl = (file) => {
  return file?.path || file?.secure_url || file?.url || "";
};

const getCloudinaryPublicId = (file) => {
  return file?.filename || file?.public_id || file?.publicId || "";
};

// ======================================================
// CREATE AND PUBLISH BLOG
// ======================================================

export const createBlog = async (req, res) => {
  log("========== CREATE BLOG START ==========");
  log("Request method:", req.method);
  log("Request path:", req.originalUrl);
  log("Content-Type:", req.headers["content-type"]);
  log("Request received at:", new Date().toISOString());

  try {
    const {
      title,
      slug,
      excerpt,
      content,
      category,
      author,
      tags,
      seo,
      metaTitle,
      metaDescription,
      keywords,
      coverImageAlt,
    } = req.body || {};

    log("Request body keys:", Object.keys(req.body || {}));
    log("Title received:", Boolean(title));
    log("Content received:", Boolean(content));
    log("Category received:", Boolean(category));

    const images = getUploadedImages(req);
    const video = getUploadedVideo(req);
    const cover = getUploadedCover(req);

    log("Uploaded image count:", images.length);
    log("Video attached:", Boolean(video));
    log("Cover image attached:", Boolean(cover));

    if (images.length > 10) {
      log("Validation failed: more than 10 images");
      return res.status(400).json({
        success: false,
        message: "A blog can contain a maximum of 10 images.",
      });
    }

    const cleanTitle = normalizeString(title);
    const cleanContent = normalizeString(content);
    const cleanCategory = normalizeString(category);

    if (!cleanTitle || !cleanContent || !cleanCategory) {
      log("Validation failed: missing required fields");

      return res.status(400).json({
        success: false,
        message: "Title, content and category are required.",
      });
    }

    if (cleanTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Title cannot exceed 200 characters.",
      });
    }

    if (cleanContent.length > 200000) {
      return res.status(400).json({
        success: false,
        message: "Blog content is too long.",
      });
    }

    if (cleanCategory.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category cannot exceed 100 characters.",
      });
    }

    const cleanExcerpt = normalizeString(excerpt);

    if (cleanExcerpt.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Excerpt cannot exceed 500 characters.",
      });
    }

    const generatedSlug = makeSlug(slug || cleanTitle);

    if (!generatedSlug) {
      return res.status(400).json({
        success: false,
        message: "Could not generate a valid blog slug.",
      });
    }

    log("Generated slug:", generatedSlug);

    const existingBlog = await Blog.findOne({ slug: generatedSlug })
      .select("_id slug")
      .lean();

    if (existingBlog) {
      log("Duplicate slug found:", generatedSlug);

      return res.status(409).json({
        success: false,
        message: "A blog with this slug already exists.",
        slug: generatedSlug,
      });
    }

    const imageDocuments = images.map((file) => ({
      url: getCloudinaryUrl(file),
      publicId: getCloudinaryPublicId(file),
      alt: "",
    }));

    const invalidImage = imageDocuments.some((image) => !image.url);

    if (invalidImage) {
      log("Upload validation failed: an image has no Cloudinary URL");

      return res.status(400).json({
        success: false,
        message: "An uploaded image is missing its Cloudinary URL.",
      });
    }

    const coverUrl = getCloudinaryUrl(cover);
    const videoUrl = getCloudinaryUrl(video);

    if (cover && !coverUrl) {
      log("Cover image has no Cloudinary URL");

      return res.status(400).json({
        success: false,
        message: "Cover image upload URL is missing.",
      });
    }

    if (video && !videoUrl) {
      log("Video has no Cloudinary URL");

      return res.status(400).json({
        success: false,
        message: "Video upload URL is missing.",
      });
    }

    const seoInput = parseObject(seo);

    const cleanTags = parseArray(tags);
    const cleanKeywords = parseArray(
      seoInput.keywords ?? keywords
    );

    const finalMetaTitle = normalizeString(
      seoInput.metaTitle ?? metaTitle
    );

    const finalMetaDescription = normalizeString(
      seoInput.metaDescription ?? metaDescription
    );

    if (finalMetaTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message: "SEO meta title cannot exceed 200 characters.",
      });
    }

    if (finalMetaDescription.length > 320) {
      return res.status(400).json({
        success: false,
        message: "SEO meta description cannot exceed 320 characters.",
      });
    }

    log("Preparing MongoDB document...");

    const blogData = {
      title: cleanTitle,
      slug: generatedSlug,
      excerpt: cleanExcerpt,
      content: cleanContent,
      category: cleanCategory,
      tags: cleanTags,
      author: normalizeString(author) || "Advixio Team",
      coverImage: {
        url: coverUrl,
        publicId: getCloudinaryPublicId(cover),
      },
      images: imageDocuments,
      video: {
        url: videoUrl,
        publicId: getCloudinaryPublicId(video),
        duration: 0,
        format: video?.format || "",
      },
      status: "published",
      publishedAt: new Date(),
      seo: {
        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDescription,
        keywords: cleanKeywords,
      },
    };

    log("Saving blog to MongoDB...");
    const blog = await Blog.create(blogData);

    log("Blog saved successfully.");
    log("Blog ID:", blog._id.toString());
    log("Blog slug:", blog.slug);
    log("Published at:", blog.publishedAt);
    log("========== CREATE BLOG SUCCESS ==========");

    return res.status(201).json({
      success: true,
      message: "Blog created and published successfully.",
      data: blog,
    });
  } catch (error) {
    logError("CREATE BLOG FAILED", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A blog with this slug already exists.",
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Blog validation failed.",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create blog.",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL PUBLISHED BLOGS
// ======================================================

export const getPublishedBlogs = async (req, res) => {
  log("========== GET PUBLISHED BLOGS START ==========");

  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(50, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    log("Page:", page, "Limit:", limit, "Skip:", skip);

    const filter = { status: "published" };

    if (req.query.category) {
      filter.category = normalizeString(req.query.category);
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .select("-content")
        .sort({ publishedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    log("Published blogs found:", blogs.length);
    log("Total matching blogs:", total);
    log("========== GET PUBLISHED BLOGS SUCCESS ==========");

    return res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError("GET PUBLISHED BLOGS FAILED", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs.",
      error: error.message,
    });
  }
};

// ======================================================
// GET ONE PUBLISHED BLOG BY SLUG
// ======================================================

export const getBlogBySlug = async (req, res) => {
  log("========== GET BLOG BY SLUG START ==========");

  try {
    const slug = normalizeString(req.params.slug).toLowerCase();

    log("Requested slug:", slug);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Blog slug is required.",
      });
    }

    const blog = await Blog.findOne({
      slug,
      status: "published",
    });

    if (!blog) {
      log("No published blog found for slug:", slug);

      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    log("Blog found:", blog._id.toString());

    // Increment views without blocking the response.
    Blog.updateOne(
      { _id: blog._id, status: "published" },
      { $inc: { views: 1 } }
    )
      .exec()
      .then(() => log("View count incremented:", blog._id.toString()))
      .catch((error) => logError("VIEW COUNT UPDATE FAILED", error));

    log("========== GET BLOG BY SLUG SUCCESS ==========");

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    logError("GET BLOG BY SLUG FAILED", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog.",
      error: error.message,
    });
  }
};

// ======================================================
// GET ONE PUBLISHED BLOG BY MONGODB ID
// ======================================================

export const getBlogById = async (req, res) => {
  log("========== GET BLOG BY ID START ==========");

  try {
    const { id } = req.params;

    log("Requested blog ID:", id);

    if (!mongoose.isValidObjectId(id)) {
      log("Invalid MongoDB ObjectId:", id);

      return res.status(400).json({
        success: false,
        message: "Invalid blog ID.",
      });
    }

    const blog = await Blog.findOne({
      _id: id,
      status: "published",
    });

    if (!blog) {
      log("Blog not found:", id);

      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    log("Blog found:", blog._id.toString());
    log("========== GET BLOG BY ID SUCCESS ==========");

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    logError("GET BLOG BY ID FAILED", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog.",
      error: error.message,
    });
  }
};
