import mongoose from "mongoose";
import crypto from "crypto";

/**
 * Newsletter subscriber.
 *
 * Any visitor can subscribe from the home page. Unsubscribing never deletes the
 * record — it flips `isActive` to false so we keep an audit trail and can
 * reactivate the same email later without creating duplicates.
 */
const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    // Where the subscription came from (useful for conversion analytics).
    source: {
      type: String,
      enum: ["home", "footer", "popup", "other"],
      default: "home",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Random token used by the unsubscribe link we email to subscribers.
    unsubscribeToken: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
