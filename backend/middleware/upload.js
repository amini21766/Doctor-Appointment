import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Multer uses memory storage so the upload handler can decide whether to push
 * the buffer to Cloudinary (when configured) or write it to ./uploads (dev).
 */
const storage = multer.memoryStorage();

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WEBP or GIF images are allowed"));
    }
    return cb(null, true);
  },
});

/** Write a buffer to ./uploads and return the public "/uploads/<name>" path. */
export const saveLocally = (file) => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const ext = path.extname(file.originalname) || ".png";
  const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, name), file.buffer);
  return `/uploads/${name}`;
};

export default upload;