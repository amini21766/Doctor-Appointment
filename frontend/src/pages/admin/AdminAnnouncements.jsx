import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FiAlertTriangle,
  FiExternalLink,
  FiMail,
  FiSend,
  FiSettings,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";
import DeliverySettingsModal from "./DeliverySettingsModal.jsx";

const emptyForm = { title: "", message: "", link: "", linkLabel: "" };

// Mirrors backend/routes/announcementRoutes.js so mistakes are caught instantly.
const LINK_PATTERN = /^(https?:\/\/\S+|\/\S*|(\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?)$/i;

const STATUS_STYLES = {
  sent: { label: "Sent", className: "bg-green-100 text-green-700" },
  partial: { label: "Partially sent", className: "bg-amber-100 text-amber-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
  skipped: { label: "Skipped", className: "bg-slate-200 text-slate-600" },
};

const formatWhen = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

/**
 * Superadmin announcements: compose a message and deliver it to every active
 * newsletter subscriber. Every send is stored so the history is auditable.
 */
export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/announcements");
      setAnnouncements(data.data.announcements || []);
      setStats(data.data.stats);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const audienceCount = stats?.activeSubscribers ?? 0;
  const isValid = form.title.trim().length >= 3 && form.message.trim().length >= 5;

  const askSend = (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Add a title (at least 3 characters) and a message (at least 5).");
      return;
    }
    if (audienceCount === 0) {
      toast.error("There are no active subscribers to notify yet.");
      return;
    }
    if (form.link.trim() && !LINK_PATTERN.test(form.link.trim())) {
      toast.error(
        "Button link: use a full URL, a domain like example.com, or a path like /doctors."
      );
      return;
    }
    setConfirmOpen(true);
  };

  const send = async () => {
    setSending(true);
    try {
      const { data } = await api.post("/admin/announcements", {
        title: form.title.trim(),
        message: form.message.trim(),
        link: form.link.trim() || undefined,
        linkLabel: form.linkLabel.trim() || undefined,
      });
      toast.success(data.message);
      setForm(emptyForm);
      setConfirmOpen(false);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (announcement) => {
    if (!window.confirm(`Delete "${announcement.title}" from the history?`)) return;
    try {
      const { data } = await api.delete(`/admin/announcements/${announcement._id}`);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">Announcements</h2>
          <p className="mt-1 text-sm text-slate-500">
            Send an update to everyone subscribed to the newsletter.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-primary-light text-primary">
            <FiUsers /> {audienceCount} active subscriber{audienceCount === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="badge min-h-9 border border-slate-200 px-3 text-slate-600 transition hover:bg-slate-50"
            onClick={() => setSettingsOpen(true)}
          >
            <FiSettings /> Delivery settings
          </button>
        </div>
      </div>

      {stats && stats.emailMode !== "smtp" && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <FiAlertTriangle className="mt-0.5 shrink-0 text-lg" />
          <div>
            {stats.emailMode === "test" ? (
              <p>
                <strong>Test delivery mode is active.</strong> No SMTP provider is configured, so
                announcements are emailed to a free Ethereal test inbox instead. Each send gets an{" "}
                <em>Open email preview</em> link, but nothing lands in real subscriber inboxes yet.
              </p>
            ) : (
              <p>
                <strong>Outbox mode is active.</strong> No SMTP provider is configured, so every
                announcement is written to <code>backend/outbox</code> as an <code>.eml</code> file
                instead of being emailed.
              </p>
            )}
            <p className="mt-1">
              Add your provider credentials to start reaching real inboxes. They are stored in the
              database and verified immediately — no file edits or backend restart needed.
            </p>
            <button
              type="button"
              className="btn-primary mt-3 py-2"
              onClick={() => setSettingsOpen(true)}
            >
              <FiSettings /> Configure real delivery
            </button>
            <p className="mt-3 text-xs">
              Prefer environment variables? Set <code>SMTP_HOST</code>, <code>SMTP_USER</code>,{" "}
              <code>SMTP_PASSWORD</code> and <code>EMAIL_FROM</code> in <code>backend/.env</code>{" "}
              and restart the backend.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium underline">
                Show provider examples
              </summary>
              <ul className="mt-2 space-y-1 text-xs">
                <li><strong>Gmail:</strong> smtp.gmail.com · 465 · your address · 16-char App Password (2FA required)</li>
                <li><strong>Resend:</strong> smtp.resend.com · 465 · <code>resend</code> · your API key</li>
                <li><strong>SendGrid:</strong> smtp.sendgrid.net · 587 · <code>apikey</code> · your API key</li>
                <li><strong>Brevo:</strong> smtp-relay.brevo.com · 587 · your login · your SMTP key</li>
              </ul>
              <p className="mt-2 text-xs">
                With a provider, <code>EMAIL_FROM</code> must be a verified sender or domain,
                otherwise mail is rejected. Local testing: Mailtrap works too.
              </p>
            </details>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Compose */}
        <form onSubmit={askSend} className="card p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
            <FiMail className="text-primary" /> New announcement
          </h3>

          <div className="mt-4">
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              maxLength={160}
              placeholder="New specialty: dermatology now available"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{form.title.length}/160</p>
          </div>

          <div className="mt-2">
            <label className="label" htmlFor="message">Message</label>
            <textarea
              id="message"
              rows={6}
              className="input"
              maxLength={5000}
              placeholder={"Hello! We have news for you…\n\nWrite one or two short paragraphs. Blank lines start a new paragraph."}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <p className="mt-1 flex justify-between text-xs text-slate-400">
              <span>Blank lines become paragraphs.</span>
              <span>{form.message.length}/5000</span>
            </p>
          </div>

          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="link">Button link (optional)</label>
              <input
                id="link"
                className="input"
                placeholder="https://example.com/offers"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-400">
                Full URL, a domain (example.com) or an in-app path (/doctors)
              </p>
            </div>
            <div>
              <label className="label" htmlFor="linkLabel">Button label</label>
              <input
                id="linkLabel"
                className="input"
                maxLength={60}
                placeholder="Learn more"
                value={form.linkLabel}
                onChange={(e) => setForm({ ...form, linkLabel: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary mt-5 w-full"
            disabled={sending || !isValid || audienceCount === 0}
          >
            <FiSend /> Send to {audienceCount} subscriber{audienceCount === 1 ? "" : "s"}
          </button>
        </form>

        {/* Live preview of the email */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</span>
            <span className="text-xs text-slate-400">Subscriber inbox</span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">+</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Prescripto</p>
                <p className="break-all text-xs text-slate-400">newsletter@prescripto.test</p>
              </div>
            </div>

            <h4 className="mt-5 break-words text-lg font-bold text-ink">
              {form.title.trim() || "Your announcement title"}
            </h4>
            <p
              className={`mt-2 whitespace-pre-line text-sm leading-relaxed ${
                form.message.trim() ? "text-slate-600" : "italic text-slate-400"
              }`}
            >
              {form.message.trim() || "Your message will appear here. Keep it short and useful."}
            </p>

            {form.link.trim() && (
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-white">
                {form.linkLabel.trim() || "Learn more"} <FiExternalLink />
              </span>
            )}

            <p className="mt-6 border-t border-slate-100 pt-3 text-xs text-slate-400">
              You&apos;re receiving this because you subscribed to the Prescripto newsletter.
              Unsubscribe.
            </p>
          </div>
        </div>
      </div>

      {/* Reach summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <FiUsers /> Active subscribers
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{audienceCount}</p>
          <p className="mt-1 text-xs text-slate-400">{stats?.totalSubscribers ?? 0} total signups</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <FiMail /> Announcements
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{stats?.announcements ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">Saved in history</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <FiSend /> Last activity
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">{formatWhen(stats?.lastSentAt)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {stats?.emailMode === "smtp"
              ? "Real email delivery enabled"
              : stats?.emailMode === "test"
                ? "Ethereal test inbox mode"
                : "Local outbox mode"}
          </p>
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
        <h3 className="text-base font-semibold text-ink">History</h3>

        {loading ? (
          <Loading label="Loading announcements..." />
        ) : announcements.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="📣"
              title="No announcements yet"
              message="Write your first update above — it will be listed here with its delivery result."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {announcements.map((announcement) => {
              const status = STATUS_STYLES[announcement.status] || STATUS_STYLES.skipped;
              const modeNote =
                announcement.status === "sent" && announcement.deliveryMode === "test"
                  ? " · test inbox"
                  : announcement.status === "sent" && announcement.deliveryMode === "outbox"
                    ? " · outbox"
                    : "";
              return (
                <article key={announcement._id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words font-semibold text-ink">{announcement.title}</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatWhen(announcement.createdAt)} · by{" "}
                        {announcement.sentBy?.name || "admin"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${status.className}`}>{status.label}{modeNote}</span>
                      <button
                        type="button"
                        onClick={() => remove(announcement)}
                        aria-label={`Delete ${announcement.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">
                    {announcement.message}
                  </p>

                  {announcement.link && (
                    <a
                      href={announcement.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex min-w-0 items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
                    >
                      <FiExternalLink /> {announcement.linkLabel || announcement.link}
                    </a>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="badge bg-slate-100 text-slate-600">
                      Audience {announcement.stats?.total ?? 0}
                    </span>
                    <span className="badge bg-green-50 text-green-700">
                      Sent {announcement.stats?.sent ?? 0}
                    </span>
                    {(announcement.stats?.failed ?? 0) > 0 && (
                      <span className="badge bg-red-50 text-red-600">
                        Failed {announcement.stats.failed}
                      </span>
                    )}
                    {(announcement.stats?.skipped ?? 0) > 0 && (
                      <span className="badge bg-amber-50 text-amber-700">
                        Skipped {announcement.stats.skipped}
                      </span>
                    )}
                  </div>

                  {announcement.previewUrl && (
                    <a
                      href={announcement.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <FiExternalLink /> Open email preview
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!sending) setConfirmOpen(false);
        }}
        title="Send this announcement?"
        footer={
          <>
            <button
              type="button"
              className="btn-ghost py-2"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              Cancel
            </button>
            <button type="button" className="btn-primary py-2" onClick={send} disabled={sending}>
              <FiSend /> {sending ? "Sending..." : `Send to ${audienceCount}`}
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          <strong className="text-ink">{form.title.trim()}</strong> will be emailed to{" "}
          <strong className="text-ink">{audienceCount}</strong> active subscriber
          {audienceCount === 1 ? "" : "s"}. This cannot be undone.
        </p>
        {stats?.emailMode === "test" && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Test mode: messages go to a free Ethereal test inbox, not to real subscriber
            addresses. A preview link will be saved in the history so you can check the email.
          </p>
        )}
        {stats?.emailMode === "outbox" && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Outbox mode: messages are written to <code>backend/outbox</code> as{" "}
            <code>.eml</code> files — nothing is emailed yet.
          </p>
        )}
      </Modal>

      <DeliverySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

