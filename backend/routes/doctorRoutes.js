import express from "express";
import {
  listDoctors,
  getDoctor,
  listBySpecialty,
  getAvailability,
  updateAvailability,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin, requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public
router.get("/", listDoctors);
router.get("/specialty/:specialty", listBySpecialty);
router.get("/:id/availability", getAvailability);
router.get("/:id", getDoctor);

// Doctor self or admin — availability
router.put(
  "/:id/availability",
  requireAuth,
  requireRole("doctor", "admin"),
  updateAvailability
);

// Admin only — create
router.post("/", requireAuth, requireAdmin, createDoctor);
// Update: admin can edit anyone; a doctor can edit only their own record
// (ownership is enforced inside the controller).
router.put("/:id", requireAuth, requireRole("admin", "doctor"), updateDoctor);
// Admin only — delete
router.delete("/:id", requireAuth, requireAdmin, deleteDoctor);

export default router;