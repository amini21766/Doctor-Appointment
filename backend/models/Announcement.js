import mongoose from "mongoose";

/**
 * An announcement written by a superadmin (admin role) and delivered to every
 * active newsletter subscriber. The record doubles as the send history so the
 * admin panel can show what went out, when, and to how many people.
 */
const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 5000,
    },
    // Optional call-to-action button inside the email.
    link: {
      type: String,
      trim: true,
      default: "",
    },
    linkLabel: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    audience: {
      type: String,
      enum: ["subscribers"],
      default: "subscribers",
    },
    // Delivery outcome: sent = all delivered, partial = some failed,
    // failed = none delivered, skipped = nothing attempted.
    status: {
      type: String,
      enum: ["sent", "partial", "failed", "skipped"],
      default: "skipped",
      index: true,
    },
    emailConfigured: {
      type: Boolean,
      default: false,
    },
    // How the emails actually left the server:
    //   smtp   -> real SMTP provider, delivered to subscriber inboxes
    //   test   -> Ethereal test inbox (free, auto-created, previewUrl available)
    //   outbox -> .eml files written to backend/outbox (offline fallback)
    deliveryMode: {
      type: String,
      enum: ["smtp", "test", "outbox"],
      default: "smtp",
    },
    // Preview URL for test-mode deliveries (first recipient's message).
    previewUrl: {
      type: String,
      default: null,
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

announcementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
