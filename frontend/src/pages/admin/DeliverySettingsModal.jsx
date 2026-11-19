import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiCheckCircle, FiExternalLink, FiMail, FiTrash2 } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import Modal from "../../components/Modal.jsx";

const MODE_BADGES = {
  test: { label: "Ethereal test inbox", className: "bg-amber-100 text-amber-700" },
  outbox: { label: "Local .eml outbox", className: "bg-slate-200 text-slate-600" },
};

/** SMTP is only "real delivery" once the connection check has succeeded. */
const badgeFor = (settings) => {
  if (settings?.mode !== "smtp") return MODE_BADGES[settings?.mode] || MODE_BADGES.outbox;
  if (settings.verified === null) {
    return { label: "Real email (SMTP, from .env)", className: "bg-green-100 text-green-700" };
  }
  if (settings.verified) {
    return { label: "Real email (SMTP) — verified", className: "bg-green-100 text-green-700" };
  }
  return { label: "SMTP saved — not verified", className: "bg-amber-100 text-amber-700" };
};

const SOURCE_LABELS = {
  db: "saved in the admin panel",
  env: "backend/.env (SMTP_*)",
  none: "not configured yet",
};

const emptyForm = { host: "", port: "587", user: "", password: "", from: "", to: "" };

/**
 * Configure real email delivery without editing files or restarting the API.
 * Credentials are stored in MongoDB (password encrypted) and take priority over
 * the SMTP_* variables in backend/.env.
 */
export default function DeliverySettingsModal({ open, onClose, onSaved }) {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/email-settings");
      const next = data.data;
      setSettings(next);
      setForm({
        host: next.host || "",
        port: String(next.port || 587),
        user: next.user || "",
        password: "",
        from: next.from || "",
        to: next.user || "",
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLastTest(null);
      fetchSettings();
    }
  }, [open, fetchSettings]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.host.trim() || !form.user.trim()) {
      toast.error("SMTP host and user are required.");
      return;
    }
    if (!form.password && !settings?.hasPassword) {
      toast.error("Enter the SMTP password (or app password / API key).");
      return;
    }
    if (!form.password && settings?.hasPassword && settings?.verified === false) {
      toast.error(
        "The saved password failed Gmail's check — type the 16-character App Password again (or use “Remove saved settings” first)."
      );
      return;
    }
    setSaving(true);
    setLastTest(null);
    try {
      const { data } = await api.put("/admin/email-settings", {
        host: form.host.trim(),
        port: Number(form.port) || 587,
        user: form.user.trim(),
        password: form.password || undefined,
        from: form.from.trim() || undefined,
      });
      await fetchSettings();
      if (data.data.verification?.ok) toast.success(data.message);
      else toast.warn(data.message);
      onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!form.to.trim()) {
      toast.error("Enter a recipient address for the test email.");
      return;
    }
    setTesting(true);
    setLastTest(null);
    try {
      const { data } = await api.post("/admin/email-settings/test", { to: form.to.trim() });
      setLastTest(data.data);
      toast.success(data.message);
      await fetchSettings();
    } catch (err) {
      toast.error(getErrorMessage(err));
      await fetchSettings();
    } finally {
      setTesting(false);
    }
  };

  const removeSaved = async () => {
    if (!window.confirm("Remove the saved SMTP credentials and return to the default mode?")) return;
    try {
      const { data } = await api.delete("/admin/email-settings");
      toast.success(data.message);
      setLastTest(null);
      await fetchSettings();
      onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const badge = badgeFor(settings);
  const isGmail = /gmail\.com$/i.test(form.host.trim());
  const gmailPassword = form.password.replace(/\s+/g, "");
  const gmailPasswordSuspicious = isGmail && form.password.length > 0 && gmailPassword.length !== 16;
  const fromMismatch =
    isGmail && form.user.trim() && !form.from.toLowerCase().includes(form.user.trim().toLowerCase());

  return (
    <Modal open={open} onClose={onClose} title="Email delivery settings" maxWidth="max-w-2xl">
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading settings…</p>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`badge ${badge.className}`}>
              <FiMail /> {badge.label}
            </span>
            <span className="text-xs text-slate-500">
              Source: {SOURCE_LABELS[settings?.source] || settings?.source}
            </span>
          </div>

          <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            Use a Gmail App Password, a Resend/SendGrid API key, or any SMTP relay. Once these
            credentials are verified, announcements go straight to subscriber inboxes — no restart
            needed.
          </p>

          {settings?.source === "db" && settings.verified === false && settings.lastError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <p className="font-medium">Last connection check failed</p>
              <p className="mt-1 break-words">{settings.lastError}</p>
              {/535|BadCredentials|Invalid login|Username and Password not accepted/i.test(
                settings.lastError
              ) && (
                <p className="mt-2">
                  Gmail rejects normal account passwords. Turn on 2-Step Verification, create an
                  16-character App Password at{" "}
                  <a
                    className="font-medium underline"
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                  >
                    myaccount.google.com/apppasswords
                  </a>
                  , then enter that value as the password and set From to your Gmail address.
                </p>
              )}
            </div>
          )}

          {settings?.source === "db" && settings.verified === true && settings.lastVerifiedAt && (
            <p className="text-xs text-green-700">
              Connection verified {new Date(settings.lastVerifiedAt).toLocaleString()}.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="smtp-host">SMTP host</label>
              <input
                id="smtp-host"
                className="input"
                placeholder="smtp.gmail.com"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="smtp-port">Port</label>
              <input
                id="smtp-port"
                className="input"
                type="number"
                min="1"
                max="65535"
                placeholder="587"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="smtp-user">User</label>
              <input
                id="smtp-user"
                className="input"
                autoComplete="off"
                placeholder="you@gmail.com"
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="smtp-password">
                Password / API key{" "}
                {settings?.hasPassword && <span className="text-slate-400">(saved)</span>}
              </label>
              <input
                id="smtp-password"
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder={
                  settings?.hasPassword
                    ? "Leave blank to keep the saved one"
                    : "App password or API key"
                }
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {isGmail && (
                <p className="mt-1 text-xs text-slate-400">
                  16-character App Password (2-Step Verification on) — not your Gmail login
                  password.
                </p>
              )}
              {gmailPasswordSuspicious && (
                <p className="mt-1 text-xs text-amber-600">
                  That is {gmailPassword.length} characters. Gmail App Passwords are exactly 16
                  letters — this looks like your account password, which Gmail always rejects.
                </p>
              )}
            </div>
          </div>


          <div>
            <label className="label" htmlFor="smtp-from">From address</label>
            <input
              id="smtp-from"
              className="input"
              placeholder="Prescripto <newsletter@yourdomain.com>"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-400">
              Must be a verified sender/domain at your provider, otherwise mail is rejected.
              {isGmail && " For Gmail this must be the same address as User."}
            </p>
            {fromMismatch && (
              <p className="mt-1 text-xs text-amber-600">
                Gmail only sends from the authenticated address —{" "}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => setForm({ ...form, from: form.user.trim() })}
                >
                  use {form.user.trim()}
                </button>
                .
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <label className="label" htmlFor="smtp-test-to">Send a test email to</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="smtp-test-to"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
              <button
                type="button"
                className="btn-outline shrink-0 py-2.5"
                onClick={sendTest}
                disabled={testing}
              >
                {testing ? "Sending…" : "Send test"}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Tests the saved settings — save first if you changed them.
            </p>
            {lastTest && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700">
                <FiCheckCircle className="mt-0.5 shrink-0" />
                <div>
                  <p>
                    {lastTest.mode === "test"
                      ? "Test message generated in the Ethereal inbox."
                      : "Test message accepted by the provider — check the inbox (and spam)."}
                  </p>
                  {lastTest.previewUrl && (
                    <a
                      className="mt-1 inline-flex items-center gap-1 font-medium underline"
                      href={lastTest.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open email preview <FiExternalLink />
                    </a>
                  )}
                  {lastTest.file && (
                    <p className="mt-1">Written to backend/outbox/{lastTest.file}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <details className="text-xs text-slate-600">
            <summary className="cursor-pointer font-medium">Provider examples</summary>
            <ul className="mt-2 space-y-1">
              <li><strong>Gmail:</strong> smtp.gmail.com · 465 · your address · 16-char App Password (2FA required)</li>
              <li><strong>Resend:</strong> smtp.resend.com · 465 · <code>resend</code> · your API key</li>
              <li><strong>SendGrid:</strong> smtp.sendgrid.net · 587 · <code>apikey</code> · your API key</li>
              <li><strong>Brevo:</strong> smtp-relay.brevo.com · 587 · your login · your SMTP key</li>
            </ul>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            {settings?.source === "db" ? (
              <button type="button" className="btn-ghost text-red-600" onClick={removeSaved}>
                <FiTrash2 /> Remove saved settings
              </button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button type="button" className="btn-outline min-h-11" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn-primary min-h-11" disabled={saving}>
                {saving ? "Verifying…" : "Save & verify"}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

