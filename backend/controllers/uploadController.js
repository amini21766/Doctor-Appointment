import cloudinary, { cloudinaryEnabled } from "../config/cloudinary.js";
import { saveLocally } from "../middleware/upload.js";
import { ApiError } from "../middleware/errorMiddleware.js";

/**
 * POST /api/uploads/image  (authenticated)
 * Uploads an image to Cloudinary when configured, otherwise writes it to the
 * local ./uploads directory so the app works fully offline in development.
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "No image file provided");

    let url;

    if (cloudinaryEnabled) {
      url = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "doctor-appointments", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            return resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    } else {
      url = saveLocally(req.file);
    }

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: { url, storage: cloudinaryEnabled ? "cloudinary" : "local" },
    });
  } catch (err) {
    return next(err);
  }
};

export default { uploadImage };