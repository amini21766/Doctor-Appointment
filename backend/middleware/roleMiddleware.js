import { ApiError } from "./errorMiddleware.js";

/** Restrict a route to one or more roles. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Not authorized"));
  }
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden: insufficient permissions"));
  }
  return next();
};

export const requirePatient = requireRole("patient");
export const requireDoctor = requireRole("doctor");
export const requireAdmin = requireRole("admin");

export default requireRole;