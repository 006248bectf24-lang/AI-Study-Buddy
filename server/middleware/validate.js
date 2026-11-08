import ApiError from "../utils/ApiError.js";

// Validates req.body with a zod schema
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    return next(new ApiError(400, message));
  }
  req.body = result.data;
  next();
};
