import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const files = [
  "config/db.js",
  "config/cloudinary.js",
  "models/User.js",
  "models/Doctor.js",
  "models/Appointment.js",
  "models/Specialty.js",
  "middleware/errorMiddleware.js",
  "middleware/authMiddleware.js",
  "middleware/roleMiddleware.js",
  "middleware/validate.js",
  "middleware/rateLimiter.js",
  "utils/generateToken.js",
  "utils/slotGenerator.js",
  "services/emailService.js",
  "services/doctorService.js",
  "services/appointmentService.js",
  "controllers/authController.js",
  "controllers/doctorController.js",
  "controllers/appointmentController.js",
  "controllers/userController.js",
  "controllers/adminController.js",
  "controllers/specialtyController.js",
  "routes/authRoutes.js",
  "routes/doctorRoutes.js",
  "routes/appointmentRoutes.js",
  "routes/userRoutes.js",
  "routes/adminRoutes.js",
  "routes/specialtyRoutes.js",
];

let fail = 0;
for (const f of files) {
  try {
    await import(path.join(root, f));
    console.log("OK  ", f);
  } catch (e) {
    fail += 1;
    console.log("FAIL", f, "->", e.message);
  }
}
console.log(fail === 0 ? "ALL MODULES IMPORTED OK" : `${fail} MODULE(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);