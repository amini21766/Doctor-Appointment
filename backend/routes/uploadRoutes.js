import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { uploadImage } from "../controllers/uploadController.js";

const router = express.Router();

// Any authenticated user (patient, doctor or admin) may upload an image.
router.post("/image", requireAuth, upload.single("image"), uploadImage);

export default router;