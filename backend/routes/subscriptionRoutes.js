import express from "express";
import { body } from "express-validator";
import {
  subscribe,
  unsubscribe,
  listSubscribers,
} from "../controllers/subscriptionController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import { subscribeLimiter } from "../middleware/rateLimiter.js";
import validate from "../middleware/validate.js";

const router = express.Router();

/** POST /api/subscriptions — public newsletter signup */
router.post(
  "/",
  subscribeLimiter,
  [
    body("email").trim().toLowerCase().isEmail().withMessage("A valid email is required"),
    body("name").optional({ values: "falsy" }).trim().isLength({ max: 120 }),
    body("source").optional().isIn(["home", "footer", "popup", "other"]),
  ],
  validate,
  subscribe
);

/** POST /api/subscriptions/unsubscribe — public, by emailed token (or email) */
router.post(
  "/unsubscribe",
  subscribeLimiter,
  [
    body("email").optional({ values: "falsy" }).trim().toLowerCase().isEmail()
      .withMessage("A valid email is required"),
    body("token").optional({ values: "falsy" }).trim().isLength({ min: 8, max: 100 })
      .withMessage("Invalid unsubscribe token"),
  ],
  validate,
  unsubscribe
);

/** GET /api/subscriptions — admin overview of every subscriber */
router.get("/", requireAuth, requireAdmin, listSubscribers);

export default router;
