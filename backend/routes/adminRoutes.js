import express from "express";
import {
  dashboard,
  listPatients,
  getPatient,
  listDoctors,
  setDoctorStatus,
} from "../controllers/adminController.js";
import { allAppointments } from "../controllers/appointmentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Every admin route requires an authenticated admin.
router.use(requireAuth, requireAdmin);

router.get("/dashboard", dashboard);
router.get("/patients", listPatients);
router.get("/patients/:id", getPatient);
router.get("/doctors", listDoctors);
router.patch("/doctors/:id/status", setDoctorStatus);
router.get("/appointments", allAppointments);

export default router;