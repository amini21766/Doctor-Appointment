import express from "express";
import {
  listSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from "../controllers/specialtyController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

/**
 * Optional auth: attaches req.user when a valid token is present so the
 * list endpoint can return inactive specialties to admins (?all=true),
 * without blocking anonymous visitors.
 */
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) req.user = user;
    }
  } catch (err) {
    // Ignore — anonymous is fine here.
  }
  return next();
};

const router = express.Router();

router.get("/", optionalAuth, listSpecialties);
router.post("/", requireAuth, requireAdmin, createSpecialty);
router.put("/:id", requireAuth, requireAdmin, updateSpecialty);
router.delete("/:id", requireAuth, requireAdmin, deleteSpecialty);

export default router;