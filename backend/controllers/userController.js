import User from "../models/User.js";
import { ApiError } from "../middleware/errorMiddleware.js";

/** GET /api/users/profile  (authenticated) */
export const getProfile = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      message: "Profile fetched successfully",
      data: req.user.toSafeJSON(),
    });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/users/profile  (authenticated) */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");

    if (name !== undefined) {
      if (!String(name).trim()) throw new ApiError(400, "Name cannot be empty");
      user.name = String(name).trim();
    }
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    // Keep the denormalized doctor.name in sync when a doctor updates their name.
    if (user.role === "doctor" && name !== undefined) {
      const Doctor = (await import("../models/Doctor.js")).default;
      await Doctor.findOneAndUpdate({ user: user._id }, { name: user.name });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: user.toSafeJSON(),
    });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/users/change-password  (authenticated) */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current and new password are required");
    }
    if (newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters");
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    const matches = await user.comparePassword(currentPassword);
    if (!matches) throw new ApiError(401, "Current password is incorrect");

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: "Password changed successfully", data: null });
  } catch (err) {
    return next(err);
  }
};

export default { getProfile, updateProfile, changePassword };