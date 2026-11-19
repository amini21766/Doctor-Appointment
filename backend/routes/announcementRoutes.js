import express from "express";
import { body } from "express-validator";
import {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import validate from "../middleware/validate.js";

const router = express.Router();

// Superadmin only (the platform's "admin" role).
router.use(requireAuth, requireAdmin);

router.get("/", listAnnouncements);

router.post(
  "/",
  [
    body("title").trim().isLength({ min: 3, max: 160 })
      .withMessage("Title must be between 3 and 160 characters"),
    body("message").trim().isLength({ min: 5, max: 5000 })
      .withMessage("Message must be between 5 and 5000 characters"),
    body("link").optional({ values: "falsy" }).trim()
      .custom((value) => {
        // Accept absolute URLs, bare domains (example.com/x) and in-app paths
        // (/doctors). Anything else is a typo the admin should fix.
        if (/^https?:\/\/\S+$/i.test(value)) return true;
        if (/^\/\S*$/.test(value)) return true;
        if (/^(\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/.test(value)) return true;
        throw new Error("Link must be a full URL, a domain, or a path starting with /");
      }),
    body("linkLabel").optional({ values: "falsy" }).trim().isLength({ max: 60 })
      .withMessage("Button label must be 60 characters or fewer"),
  ],
  validate,
  createAnnouncement
);

router.delete("/:id", deleteAnnouncement);

export default router;
