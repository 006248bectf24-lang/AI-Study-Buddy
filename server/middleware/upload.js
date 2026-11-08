import multer from "multer";
import ApiError from "../utils/ApiError.js";

// PDFs are kept in memory (no files written to disk), max 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new ApiError(400, "Only PDF files are allowed"));
  },
});

export default upload;
