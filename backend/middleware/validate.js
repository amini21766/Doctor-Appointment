import { validationResult } from "express-validator";

/**
 * Collects express-validator results and returns a consistent 400 payload.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

export default validate;