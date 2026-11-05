
import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".xlsx" || ext === ".xls") {
    return cb(null, true);
  }

  cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
};

const bulkExcelUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default bulkExcelUpload;
