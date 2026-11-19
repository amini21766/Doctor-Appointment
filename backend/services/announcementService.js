import Announcement from "../models/Announcement.js";
import Subscriber from "../models/Subscriber.js";
import { ApiError } from "../middleware/errorMiddleware.js";
import {
  getEmailMode,
  sendEmail,
  subscriptionAnnouncementTemplate,
} from "./emailService.js";
import { buildUnsubscribeUrl } from "../utils/unsubscribeUrl.js";

// Small batches keep memory/CPU flat and avoid hammering the SMTP provider.
const BATCH_SIZE = 10;

/**
 * Turn "example.com/offers", "/doctors" or a full URL into an absolute link so
 * the email button always points somewhere valid.
 */
const normalizeLink = (raw) => {
  const link = String(raw || "").trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link)) return link;
  if (link.startsWith("//")) return `https:${link}`;
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  if (link.startsWith("/")) return `${clientUrl}${link}`;
  return `https://${link}`;
};

/**
 * Sends an announcement to every active subscriber and stores the result.
 * Each recipient gets their own unsubscribe link.
 */
export const sendAnnouncement = async ({ title, message, link, linkLabel, sentBy }) => {
  const recipients = await Subscriber.find({ isActive: true })
    .select("email unsubscribeToken")
    .lean();

  if (recipients.length === 0) {
    throw new ApiError(400, "There are no active subscribers to notify yet");
  }

  const targetLink = normalizeLink(link);
  const mode = await getEmailMode();
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let deliveryMode = mode;
  let previewUrl = null;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    // Sequential batches, parallel inside each batch.
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(
      batch.map((recipient) => {
        const unsubscribeUrl = buildUnsubscribeUrl(recipient.unsubscribeToken);
        return sendEmail({
          to: recipient.email,
          subject: title,
          html: subscriptionAnnouncementTemplate({
            title,
            message,
            link: targetLink,
            linkLabel,
            unsubscribeUrl,
          }),
          text:
            `${title}\n\n${message}\n\n` +
            `${targetLink ? `${targetLink}\n\n` : ""}` +
            `Unsubscribe: ${unsubscribeUrl}`,
        });
      })
    );

    results.forEach((result) => {
      if (result.sent) {
        sent += 1;
        if (result.mode) deliveryMode = result.mode;
        // Test-mode deliveries expose a web inbox URL; keep the first one.
        if (!previewUrl && result.previewUrl) previewUrl = result.previewUrl;
      } else {
        failed += 1;
      }
    });
  }

  let status = "failed";
  if (sent > 0 && failed === 0 && skipped === 0) status = "sent";
  else if (sent > 0) status = "partial";
  else if (skipped > 0) status = "skipped";

  const announcement = await Announcement.create({
    title,
    message,
    link: targetLink,
    linkLabel,
    sentBy,
    audience: "subscribers",
    status,
    emailConfigured: mode === "smtp",
    deliveryMode,
    previewUrl,
    stats: { total: recipients.length, sent, failed, skipped },
  });

  return announcement;
};

/** Send history plus the audience/reach numbers the admin panel shows. */
export const getAnnouncementOverview = async () => {
  const emailMode = await getEmailMode();
  const [announcements, totalSubscribers, activeSubscribers, totalAnnouncements] =
    await Promise.all([
      Announcement.find({})
        .populate("sentBy", "name email")
        .sort({ createdAt: -1 })
        .limit(100),
      Subscriber.countDocuments({}),
      Subscriber.countDocuments({ isActive: true }),
      Announcement.countDocuments({}),
    ]);

  return {
    stats: {
      emailConfigured: emailMode === "smtp",
      emailMode,
      totalSubscribers,
      activeSubscribers,
      announcements: totalAnnouncements,
      lastSentAt: announcements[0]?.createdAt || null,
    },
    announcements,
  };
};

export const deleteAnnouncement = async (id) => {
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) throw new ApiError(404, "Announcement not found");
  return announcement;
};

export default { sendAnnouncement, getAnnouncementOverview, deleteAnnouncement };
