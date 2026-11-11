/**
 * Centralized error handling.
 * - ApiError lets controllers throw errors with an HTTP status.
 * - errorHandler converts any thrown error into a consistent JSON shape.
 * - notFound handles unmatched routes.
 */

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = [];

  // Mongoose: bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Mongo: duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || { field: "" })[0];
    message =
      field === "email"
        ? "An account with this email already exists"
        : `Duplicate value for ${field}`;
  }

  // JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[error]", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default errorHandler;