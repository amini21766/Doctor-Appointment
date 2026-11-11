import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "./errorMiddleware.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new ApiError(401, "Not authorized, no token provided");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, "Not authorized, token invalid or expired");
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, "Not authorized, user no longer exists");
    }
    if (!user.isActive) {
      throw new ApiError(403, "Account is deactivated");
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;
    return next();
  } catch (err) {
    return next(err);
  }
};

export default requireAuth;