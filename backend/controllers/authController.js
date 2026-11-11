import crypto from "crypto";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Specialty from "../models/Specialty.js";
import generateToken from "../utils/generateToken.js";
import { ApiError } from "../middleware/errorMiddleware.js";
import { sendEmail, resetPasswordEmailTemplate } from "../services/emailService.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email and password are required");
    }
    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const user = await User.create({
      name,
      email,
      phone: phone || "",
      password,
      role: "patient",
    });

    const token = generateToken(user._id, user.role);
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { token, user: user.toSafeJSON() },
    });
  } catch (err) {
    return next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (!user.isActive) {
      throw new ApiError(403, "This account has been deactivated");
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken(user._id, user.role);

    // Attach doctorId for doctor accounts so the frontend can route correctly.
    let doctorId = null;
    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: user._id }).select("_id");
      doctorId = doctor?._id || null;
    }

    return res.json({
      success: true,
      message: "Login successful",
      data: { token, user: { ...user.toSafeJSON(), doctorId } },
    });
  } catch (err) {
    return next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    let doctorId = null;
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: req.user._id }).select("_id");
      doctorId = doctor?._id || null;
    }
    return res.json({
      success: true,
      message: "Current user",
      data: { user: { ...req.user.toSafeJSON(), doctorId } },
    });
  } catch (err) {
    return next(err);
  }
};

export const logout = async (req, res) => {
  // JWT is stateless; the client discards the token.
  return res.json({ success: true, message: "Logged out successfully", data: null });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond success to avoid account enumeration.
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
        data: null,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: resetPasswordEmailTemplate(resetUrl),
    });

    const payload = { message: "If that email exists, a reset link has been sent.", devResetUrl: undefined };
    // In development without SMTP, return the URL so the flow is testable.
    if (!emailResult.sent && process.env.NODE_ENV !== "production") {
      payload.devResetUrl = resetUrl;
      payload.message = "Email not configured. Use the devResetUrl to reset your password.";
    }

    return res.json({ success: true, message: payload.message, data: payload });
  } catch (err) {
    return next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpire");

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({ success: true, message: "Password reset successful. Please log in.", data: null });
  } catch (err) {
    return next(err);
  }
};

// Referenced for completeness (specialty lookup kept import used in some flows).
export const _internal = { Specialty };

export default {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
};