
import multer from "multer";
import { Transform, pipeline } from "node:stream";
import cloudinary from "../config/cloudinary.js";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 10;

const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const VIDEO_TYPES = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-m4v": "m4v",
};

const log = (...args) => console.log("[BLOG UPLOAD]", ...args);

const logError = (message, error) => {
  console.error("[BLOG UPLOAD]", message, error?.message || error);
};

// Upload directly from the incoming request stream to Cloudinary.
const cloudinaryStorage = {
  _handleFile(req, file, callback) {
    const isVideo = file.fieldname === "video";
    const resourceType = isVideo ? "video" : "image";
    const folder = isVideo
      ? "advixio/blogs/videos"
      : "advixio/blogs/images";

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    let totalBytes = 0;
    let completed = false;
    let cloudinaryResult = null;

    const finish = (error, info) => {
      if (completed) return;
      completed = true;

      if (error) {
        logError(`Upload failed: ${file.originalname}`, error);
        return callback(error);
      }

      log("Upload successful:", {
        field: file.fieldname,
        filename: file.originalname,
        bytes: info.bytes,
        publicId: info.public_id,
      });

      callback(null, info);
    };

    log("Upload started:", {
      field: file.fieldname,
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    const limiter = new Transform({
      transform(chunk, encoding, transformCallback) {
        totalBytes += chunk.length;

        if (totalBytes > maxSize) {
          const error = new Error(
            isVideo
              ? "Video must not exceed 100 MB."
              : "Each image must not exceed 10 MB."
          );

          error.code = "BLOG_FILE_TOO_LARGE";
          return transformCallback(error);
        }

        transformCallback(null, chunk);
      },
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        allowed_formats: isVideo
          ? Object.values(VIDEO_TYPES)
          : Object.values(IMAGE_TYPES),
      },
      (error, result) => {
        if (error) {
          return finish(error);
        }

        if (!result?.secure_url || !result?.public_id) {
          return finish(
            new Error("Cloudinary did not return a valid upload result.")
          );
        }

        cloudinaryResult = result;

        finish(null, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: result.public_id,
          public_id: result.public_id,
          path: result.secure_url,
          secure_url: result.secure_url,
          resource_type: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    pipeline(file.stream, limiter, uploadStream, (error) => {
      if (error) {
        if (cloudinaryResult?.public_id) {
          cloudinary.uploader.destroy(cloudinaryResult.public_id, {
            resource_type: resourceType,
          }).catch((cleanupError) => {
            logError("Failed to clean up partial upload", cleanupError);
          });
        }

        finish(error);
      }
    });
  },

  _removeFile(req, file, callback) {
    const isVideo = file.fieldname === "video";
    const publicId = file.public_id || file.filename;

    if (!publicId) {
      return callback(null);
    }

    cloudinary.uploader.destroy(publicId, {
      resource_type: isVideo ? "video" : "image",
    })
      .then(() => callback(null))
      .catch((error) => callback(error));
  },
};

const upload = multer({
  storage: cloudinaryStorage,

  limits: {
    files: 11,
    fileSize: MAX_VIDEO_SIZE,
  },

  fileFilter(req, file, callback) {
    const isImageField =
      file.fieldname === "images" ||
      file.fieldname === "coverImage";

    const isVideoField = file.fieldname === "video";

    if (!isImageField && !isVideoField) {
      return callback(
        new Error("Unsupported upload field: " + file.fieldname)
      );
    }

    if (isImageField) {
      if (!IMAGE_TYPES[file.mimetype]) {
        return callback(
          new Error("Only JPG, PNG and WEBP images are allowed.")
        );
      }

      req.blogImageCount = (req.blogImageCount || 0) + 1;

      if (req.blogImageCount > MAX_IMAGES) {
        return callback(
          new Error("A blog can contain a maximum of 10 images, including the cover image.")
        );
      }
    }

    if (isVideoField && !VIDEO_TYPES[file.mimetype]) {
      return callback(
        new Error("Only MP4, MOV, WEBM and M4V videos are allowed.")
      );
    }

    log("File accepted:", file.fieldname, file.originalname);
    callback(null, true);
  },
});

const uploadBlogMedia = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "coverImage", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

export default uploadBlogMedia;
