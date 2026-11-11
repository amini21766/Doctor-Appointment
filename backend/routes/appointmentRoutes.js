import express from "express";
import { body } from "express-validator";
import {
  createAppointment,
  myAppointments,
  doctorAppointments,
  allAppointments,
  getAppointment,
  cancelAppointment,
  completeAppointment,
} from "../controllers/appointmentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requirePatient, requireDoctor, requireAdmin, requireRole } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";

const router = express.Router();

// Patient booking
router.post(
  "/",
  requireAuth,
  requirePatient,
  [
    body("doctorId").notEmpty().withMessage("Doctor is required"),
    body("appointmentDate").matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Invalid appointment date"),
    body("appointmentTime").matches(/^\d{1,2}:\d{2}$/).withMessage("Invalid appointment time"),
  ],
  validate,
  createAppointment
);

// Listings
router.get("/my", requireAuth, requirePatient, myAppointments);
router.get("/doctor", requireAuth, requireDoctor, doctorAppointments);
router.get("/all", requireAuth, requireAdmin, allAppointments);

// Single + status changes
router.get("/:id", requireAuth, getAppointment);
router.patch("/:id/cancel", requireAuth, cancelAppointment);
router.patch("/:id/complete", requireAuth, requireRole("doctor", "admin"), completeAppointment);

export default router;