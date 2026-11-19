import crypto from "crypto";
import Subscriber from "../models/Subscriber.js";
import { ApiError } from "../middleware/errorMiddleware.js";
import { sendEmail, subscriptionWelcomeTemplate } from "../services/emailService.js";
import { buildUnsubscribeUrl } from "../utils/unsubscribeUrl.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const SOURCES = ["home", "footer", "popup", "other"];

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

/**
 * POST /api/subscriptions  (public)
 * Stores an email in the newsletter list. Subscribing twice is not an error:
 * we simply tell the visitor they are already on the list.
 */
export const subscribe = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!EMAIL_REGEX.test(email)) throw new ApiError(400, "A valid email is required");

    const name = String(req.body?.name || "").trim().slice(0, 120);
    const source = SOURCES.includes(req.body?.source) ? req.body.source : "home";

    const existing = await Subscriber.findOne({ email });

    // Already subscribed → idempotent success so retries/double clicks are safe.
    if (existing?.isActive) {
      return res.json({
        success: true,
        message: "You're already subscribed to our newsletter.",
        data: { email: existing.email, subscribed: true, alreadySubscribed: true },
      });
    }

    // Re-subscribe after a previous unsubscribe.
    if (existing) {
      existing.isActive = true;
      existing.unsubscribedAt = null;
      if (name) existing.name = name;
      if (!existing.unsubscribeToken) existing.unsubscribeToken = crypto.randomUUID();
      await existing.save();

      return res.json({
        success: true,
        message: "Welcome back! Your subscription has been reactivated.",
        data: {
          email: existing.email,
          subscribed: true,
          alreadySubscribed: false,
          reactivated: true,
        },
      });
    }

    let subscriber;
    try {
      subscriber = await Subscriber.create({ email, name, source });
    } catch (err) {
      // Two requests raced past the findOne above — the other one won.
      if (err.code === 11000) {
        return res.json({
          success: true,
          message: "You're already subscribed to our newsletter.",
          data: { email, subscribed: true, alreadySubscribed: true },
        });
      }
      throw err;
    }

    // Fire-and-forget welcome email; sendEmail never throws and no-ops without SMTP.
    await sendEmail({
      to: subscriber.email,
      subject: "Welcome to the Prescripto newsletter",
      html: subscriptionWelcomeTemplate({
        unsubscribeUrl: buildUnsubscribeUrl(subscriber.unsubscribeToken),
      }),
      text:
        "Thanks for subscribing to the Prescripto newsletter! You'll get health tips, " +
        "new doctor announcements and appointment reminders.\n\n" +
        `Unsubscribe: ${buildUnsubscribeUrl(subscriber.unsubscribeToken)}`,
    });

    return res.status(201).json({
      success: true,
      message: "Thanks for subscribing! Health tips and offers are on their way.",
      data: {
        email: subscriber.email,
        subscribed: true,
        alreadySubscribed: false,
        reactivated: false,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/subscriptions/unsubscribe  (public)
 * Accepts either the emailed token or a raw email address.
 */
export const unsubscribe = async (req, res, next) => {
  try {
    const token = String(req.body?.token || req.query?.token || "").trim();
    const email = normalizeEmail(req.body?.email || req.query?.email);

    if (!token && !EMAIL_REGEX.test(email)) {
      throw new ApiError(400, "A valid unsubscribe token or email is required");
    }

    const subscriber = token
      ? await Subscriber.findOne({ unsubscribeToken: token })
      : await Subscriber.findOne({ email });

    if (!subscriber) throw new ApiError(404, "We couldn't find that subscription");

    if (!subscriber.isActive) {
      return res.json({
        success: true,
        message: "This email is already unsubscribed.",
        data: { email: subscriber.email, subscribed: false, alreadyUnsubscribed: true },
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return res.json({
      success: true,
      message: "You have been unsubscribed. You can re-subscribe any time.",
      data: { email: subscriber.email, subscribed: false, alreadyUnsubscribed: false },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/subscriptions  (admin)
 * Optional filters: ?status=active|unsubscribed&search=text
 */
export const listSubscribers = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status === "active") query.isActive = true;
    if (status === "unsubscribed") query.isActive = false;

    if (search) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ email: regex }, { name: regex }];
    }

    const [subscribers, total, activeTotal] = await Promise.all([
      Subscriber.find(query).sort({ createdAt: -1 }).limit(200),
      Subscriber.countDocuments(),
      Subscriber.countDocuments({ isActive: true }),
    ]);

    return res.json({
      success: true,
      message: "Subscribers fetched successfully",
      data: {
        total,
        activeTotal,
        count: subscribers.length,
        subscribers,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default { subscribe, unsubscribe, listSubscribers };
