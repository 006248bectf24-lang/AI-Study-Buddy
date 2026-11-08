import ApiError from "../utils/ApiError.js";

export const notFound = (req, res, next) =>
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));

// Centralized error handler
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID";
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate value - already exists";
  } else if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File too large (max 10 MB)" : err.message;
  }

  if (status === 500) console.error(err);

  res.status(status).json({
    message: status === 500 && process.env.NODE_ENV === "production" ? "Server error" : message,
  });
};
