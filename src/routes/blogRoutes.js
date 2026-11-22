
import express from "express";

import {
  createBlog,
  getPublishedBlogs,
  getBlogBySlug,
  getBlogById,
} from "../controllers/blogController.js";

import uploadBlogMedia from "../middleware/blogUploadMiddleware.js";

const router = express.Router();

// Handle Multer, validation and Cloudinary upload errors.
const handleBlogUpload = (req, res, next) => {
  console.log("[BLOG ROUTES] Upload request:", req.method, req.originalUrl);
  console.log("[BLOG ROUTES] Content-Type:", req.headers["content-type"]);

  uploadBlogMedia(req, res, (error) => {
    if (error) {
      console.error("[BLOG ROUTES] Upload failed:", error.message);
      console.error("[BLOG ROUTES] Error code:", error.code || "N/A");

      const status =
        error.code === "LIMIT_FILE_SIZE" ||
        error.code === "BLOG_FILE_TOO_LARGE"
          ? 413
          : 400;

      return res.status(status).json({
        success: false,
        message: error.message || "Blog media upload failed.",
      });
    }

    console.log(
      "[BLOG ROUTES] Images:",
      req.files?.images?.length || 0
    );
    console.log(
      "[BLOG ROUTES] Cover image:",
      Boolean(req.files?.coverImage?.length)
    );
    console.log(
      "[BLOG ROUTES] Video:",
      Boolean(req.files?.video?.length)
    );

    next();
  });
};

// Create and publish immediately.
router.post("/", handleBlogUpload, createBlog);

// List published blogs.
router.get("/", getPublishedBlogs);

// Fetch by slug.
router.get("/slug/:slug", getBlogBySlug);

// Fetch by MongoDB ID.
router.get("/:id", getBlogById);

export default router;
