import express from "express";
import { body } from "express-validator";
import validate from "../middleware/validate.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import {
  readEmailSettings,
  updateEmailSettings,
  sendTestEmail,
  deleteEmailSettings,
} from "../controllers/emailSettingsController.js";

const router = express.Router();

// Real delivery can only be configured by an admin.
router.use(requireAuth, requireAdmin);

router.get("/", readEmailSettings);
router.put(
  "/",
  [
    body("host").trim().notEmpty().withMessage("SMTP host is required"),
    body("port").optional({ values: "falsy" }).isInt({ min: 1, max: 65535 })
      .withMessage("Port must be a number between 1 and 65535"),
    body("user").trim().notEmpty().withMessage("SMTP user is required"),
    body("password").optional({ values: "falsy" }).isLength({ min: 1, max: 200 }),
    body("from").optional({ values: "falsy" }).trim().isLength({ max: 200 }),
  ],
  validate,
  updateEmailSettings
);
router.post(
  "/test",
  [body("to").isEmail().withMessage("Enter a valid recipient email address")],
  validate,
  sendTestEmail
);
router.delete("/", deleteEmailSettings);

export default router;
