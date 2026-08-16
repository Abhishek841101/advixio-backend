import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "advixio/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  },
});

const upload = multer({
  storage,

  limits: {
    files: 3,
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;