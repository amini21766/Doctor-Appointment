import {
  sendAnnouncement,
  getAnnouncementOverview,
  deleteAnnouncement as removeAnnouncement,
} from "../services/announcementService.js";

/** Build a human-readable result message from the stored delivery record. */
const resultMessage = (announcement) => {
  const { total, sent, failed, skipped } = announcement.stats;
  const plural = (count) => `${count} subscriber${count === 1 ? "" : "s"}`;

  if (announcement.status === "sent") {
    if (announcement.deliveryMode === "smtp") {
      return `Announcement sent to ${plural(sent)}`;
    }
    if (announcement.deliveryMode === "outbox") {
      return `Announcement written to backend/outbox for ${plural(total)} (no SMTP provider configured)`;
    }
    return `Announcement sent to ${total} Ethereal test inbox${
      total === 1 ? "" : "es"
    } — open the preview link. Add SMTP credentials in the admin Delivery settings for real delivery`;
  }
  if (announcement.status === "partial") {
    return `Announcement sent to ${sent} of ${total} subscribers; ${failed + skipped} failed`;
  }
  if (announcement.status === "skipped") {
    return `Announcement saved, but delivery was skipped — ${plural(total)} not notified`;
  }
  return `Announcement saved, but none of the ${total} emails could be delivered`;
};

/** POST /api/admin/announcements  (superadmin) — compose and deliver */
export const createAnnouncement = async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();
    const message = String(req.body?.message || "").trim();
    const link = String(req.body?.link || "").trim();
    const linkLabel = String(req.body?.linkLabel || "").trim();

    const announcement = await sendAnnouncement({
      title,
      message,
      link,
      linkLabel,
      sentBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: resultMessage(announcement),
      data: announcement,
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/admin/announcements  (superadmin) — history + audience stats */
export const listAnnouncements = async (req, res, next) => {
  try {
    const data = await getAnnouncementOverview();
    return res.json({
      success: true,
      message: "Announcements fetched successfully",
      data,
    });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/admin/announcements/:id  (superadmin) — remove one history entry */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    await removeAnnouncement(req.params.id);
    return res.json({ success: true, message: "Announcement deleted", data: null });
  } catch (err) {
    return next(err);
  }
};

export default { createAnnouncement, listAnnouncements, deleteAnnouncement };
