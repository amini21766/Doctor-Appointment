import mongoose from "mongoose";

/**
 * SMTP credentials saved from the admin UI. There is a single document with
 * key "smtp"; it takes precedence over the SMTP_* variables in backend/.env so
 * delivery can be configured (and tested) without editing files or restarting.
 */
const emailSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "smtp",
      unique: true,
      index: true,
    },
    host: {
      type: String,
      required: [true, "SMTP host is required"],
      trim: true,
    },
    port: {
      type: Number,
      default: 587,
      min: 1,
      max: 65535,
    },
    user: {
      type: String,
      required: [true, "SMTP user is required"],
      trim: true,
    },
    // AES-256-GCM payload from utils/secretBox.js — never returned by the API.
    password: {
      type: String,
      required: [true, "SMTP password is required"],
    },
    from: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    // Result of the last connection check (shown in the admin panel).
    verified: {
      type: Boolean,
      default: false,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const EmailSetting = mongoose.model("EmailSetting", emailSettingSchema);

export default EmailSetting;
