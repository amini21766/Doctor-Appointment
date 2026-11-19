import crypto from "crypto";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import EmailSetting from "../models/EmailSetting.js";
import { decryptSecret, encryptSecret } from "../utils/secretBox.js";

// Set EMAIL_TEST_MODE=off to skip Ethereal and write plain .eml files instead.
const TEST_MODE_DISABLED = process.env.EMAIL_TEST_MODE === "off";
const TEST_ACCOUNT_FILE = path.join(process.cwd(), ".ethereal.json");
const OUTBOX_DIR = path.join(process.cwd(), "outbox");
const DEFAULT_FROM = process.env.EMAIL_FROM || "no-reply@doctorappointment.test";

/** Gmail app passwords are usually copied as "abcd efgh ijkl mnop" — strip the spaces. */
const normalizePassword = (password, host) => {
  const value = String(password || "").trim();
  return /gmail\.com$/i.test(String(host || "")) ? value.replace(/\s+/g, "") : value;
};

/**
 * SMTP settings resolution order:
 *   1. credentials saved from the admin UI (MongoDB, password encrypted)
 *   2. SMTP_* variables in backend/.env
 *   3. Ethereal test inbox (zero config) or the local .eml outbox
 *
 * configCache: undefined = not loaded yet, null = no SMTP provider.
 */
let configCache;
let resolved = null;

const envConfig = () => {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASSWORD: password } = process.env;
  if (!host || !user || !password) return null;
  return {
    source: "env",
    host,
    port: Number(process.env.SMTP_PORT || 587),
    user,
    password: normalizePassword(password, host),
    from: DEFAULT_FROM,
  };
};

/** Load the active SMTP config (admin-UI settings win over .env). */
const loadSmtpConfig = async () => {
  if (configCache !== undefined) return configCache;
  let stored = null;
  try {
    stored = await EmailSetting.findOne({ key: "smtp" }).lean();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[email] Could not read saved email settings:", err.message);
  }
  if (stored?.host && stored?.user && stored?.password) {
    configCache = {
      source: "db",
      host: stored.host,
      port: Number(stored.port || 587),
      user: stored.user,
      password: normalizePassword(decryptSecret(stored.password), stored.host),
      from: stored.from || DEFAULT_FROM,
    };
  } else {
    configCache = envConfig();
  }
  return configCache;
};

const createSmtpTransport = (config) =>
  nodemailer.createTransport({
    host: config.host,
    port: Number(config.port || 587),
    secure: Number(config.port) === 465,
    auth: { user: config.user, pass: config.password },
  });

const createOutboxTransport = () =>
  nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });

const readCachedTestAccount = () => {
  try {
    const account = JSON.parse(fs.readFileSync(TEST_ACCOUNT_FILE, "utf8"));
    return account?.user && account?.pass ? account : null;
  } catch {
    return null;
  }
};

const cacheTestAccount = (account) => {
  try {
    fs.writeFileSync(TEST_ACCOUNT_FILE, JSON.stringify(account, null, 2));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[email] Could not cache the Ethereal account:", err.message);
  }
};

const createTestTransport = async ({ refresh = false } = {}) => {
  const cached = refresh ? null : readCachedTestAccount();
  const account = cached || (await nodemailer.createTestAccount());
  if (!cached) cacheTestAccount(account);
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
};

/** Current delivery mode: smtp | test | outbox. */
export const getEmailMode = async () =>
  (await loadSmtpConfig()) ? "smtp" : TEST_MODE_DISABLED ? "outbox" : "test";

/** Resolve the transport once per configuration (SMTP > Ethereal > outbox). */
const resolveTransport = async () => {
  if (resolved) return resolved;
  const config = await loadSmtpConfig();
  if (config) {
    resolved = { mode: "smtp", config, transport: createSmtpTransport(config) };
  } else if (TEST_MODE_DISABLED) {
    resolved = { mode: "outbox", config: null, transport: createOutboxTransport() };
  } else {
    try {
      resolved = { mode: "test", config: null, transport: await createTestTransport() };
      // eslint-disable-next-line no-console
      console.warn(
        "[email] No SMTP credentials: using an Ethereal test inbox (nothing reaches real mailboxes)."
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[email] Ethereal unavailable, writing .eml files to backend/outbox:", err.message);
      resolved = { mode: "outbox", config: null, transport: createOutboxTransport() };
    }
  }
  return resolved;
};

/**
 * Send an email. Never throws so email issues never break core flows.
 * Returns { sent, mode, previewUrl?, file?, messageId?, reason? }.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const { mode, transport, config } = await resolveTransport();
  const payload = {
    from: config?.from || DEFAULT_FROM,
    to,
    subject,
    html,
    text,
  };

  try {
    let info;
    try {
      info = await transport.sendMail(payload);
    } catch (err) {
      // A cached Ethereal account can expire; retry once with a fresh account.
      if (mode !== "test") throw err;
      resolved = { mode, transport: await createTestTransport({ refresh: true }) };
      info = await resolved.transport.sendMail(payload);
    }

    if (mode === "outbox") {
      fs.mkdirSync(OUTBOX_DIR, { recursive: true });
      const fileName = `${Date.now()}-${crypto.randomUUID()}.eml`;
      fs.writeFileSync(path.join(OUTBOX_DIR, fileName), info.message);
      return { sent: true, mode, file: fileName };
    }

    return {
      sent: true,
      mode,
      messageId: info.messageId,
      previewUrl: mode === "test" ? nodemailer.getTestMessageUrl(info) || null : null,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email] Failed to send:", err.message);
    return { sent: false, mode, reason: err.message };
  }
};

/**
 * Check that the resolved transport can connect and authenticate.
 * Used by `npm run email:test`.
 */
export const verifyEmailTransport = async () => {
  try {
    const { mode, transport } = await resolveTransport();
    if (mode === "outbox") return { ok: true, mode };
    await transport.verify();
    return { ok: true, mode };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
};

/**
 * Public-safe view of the current email configuration (never the password).
 * Used by the admin "Delivery settings" panel.
 */
export const getEmailSettings = async () => {
  const config = await loadSmtpConfig();
  let stored = null;
  if (config?.source === "db") {
    try {
      stored = await EmailSetting.findOne({ key: "smtp" }).lean();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[email] Could not read verification state:", err.message);
    }
  }
  return {
    mode: config ? "smtp" : TEST_MODE_DISABLED ? "outbox" : "test",
    source: config?.source || "none",
    host: config?.host || "",
    port: config?.port || 587,
    user: config?.user || "",
    from: config?.from || DEFAULT_FROM,
    hasPassword: Boolean(config?.password),
    // null = configured through .env, so the panel cannot verify it on demand
    verified: config?.source === "env" ? null : Boolean(stored?.verified),
    lastVerifiedAt: stored?.lastVerifiedAt || null,
    lastError: stored?.lastError || "",
    testModeAvailable: !TEST_MODE_DISABLED,
  };
};

/** Store the outcome of a connection check so the panel can show it later. */
export const recordVerification = async ({ ok, reason } = {}) => {
  await EmailSetting.updateOne(
    { key: "smtp" },
    {
      $set: {
        verified: Boolean(ok),
        lastVerifiedAt: ok ? new Date() : null,
        lastError: ok ? "" : reason || "",
      },
    }
  ).catch(() => {});
  return getEmailSettings();
};

/**
 * Save SMTP credentials from the admin UI. The password is encrypted before
 * it is stored; leaving it blank keeps the previously saved one.
 * Gmail only sends from the authenticated address, so From defaults to User.
 * Returns the new settings plus a connection check.
 */
export const saveEmailSettings = async ({ host, port, user, password, from, updatedBy }) => {
  const existing = await EmailSetting.findOne({ key: "smtp" });
  const isGmail = /gmail\.com$/i.test(String(host).trim());
  const nextPassword = password
    ? encryptSecret(normalizePassword(password, host))
    : existing?.password;
  if (!nextPassword) throw new Error("SMTP password is required");

  const resolvedFrom = from || (isGmail ? user : DEFAULT_FROM);

  await EmailSetting.findOneAndUpdate(
    { key: "smtp" },
    {
      $set: {
        host,
        port: Number(port) || 587,
        user,
        password: nextPassword,
        from: resolvedFrom,
        updatedBy: updatedBy || null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Force the next send to use the new credentials.
  configCache = undefined;
  resolved = null;

  const verification = await verifyEmailTransport();
  await recordVerification(verification);
  return { ...(await getEmailSettings()), verification };
};

/** Drop saved settings and fall back to SMTP_* env vars / test mode. */
export const clearEmailSettings = async () => {
  await EmailSetting.deleteOne({ key: "smtp" });
  configCache = undefined;
  resolved = null;
  return getEmailSettings();
};

const wrap = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b">
    <h2 style="color:#4f46e5">${title}</h2>
    <div style="font-size:15px;line-height:1.6">${body}</div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
    <p style="font-size:12px;color:#94a3b8">Doctor Appointment Platform</p>
  </div>
`;

export const resetPasswordEmailTemplate = (resetUrl) =>
  wrap(
    "Reset your password",
    `<p>You requested a password reset.</p>
     <p><a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset Password</a></p>
     <p>This link expires in 30 minutes. If you didn't request it, you can ignore this email.</p>`
  );

export const bookingConfirmationTemplate = ({ patientName, doctorName, date, time, fee }) =>
  wrap(
    "Appointment confirmed",
    `<p>Hi ${patientName},</p>
     <p>Your appointment has been booked successfully.</p>
     <ul>
       <li><strong>Doctor:</strong> ${doctorName}</li>
       <li><strong>Date:</strong> ${date}</li>
       <li><strong>Time:</strong> ${time}</li>
       <li><strong>Fee:</strong> $${fee}</li>
     </ul>`
  );

export const cancellationTemplate = ({ name, doctorName, date, time }) =>
  wrap(
    "Appointment cancelled",
    `<p>Hi ${name},</p>
     <p>Your appointment with <strong>${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.</p>`
  );

export const subscriptionWelcomeTemplate = ({ unsubscribeUrl }) =>
  wrap(
    "You're subscribed 🎉",
    `<p>Thanks for joining the Prescripto newsletter.</p>
     <p>Here's what you'll receive:</p>
     <ul>
       <li>Health tips from our verified doctors</li>
       <li>New doctor and specialty announcements</li>
       <li>Appointment reminders and seasonal offers</li>
     </ul>
     <p>No spam — one or two emails a month.</p>
     <p style="font-size:12px;color:#94a3b8">
       Changed your mind? <a href="${unsubscribeUrl}" style="color:#4f46e5">Unsubscribe here</a>.
     </p>`
  );

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toParagraphs = (value) =>
  escapeHtml(value).replace(/\r\n/g, "\n").split(/\n{2,}/g)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");

/** Email sent to every active subscriber when a superadmin publishes an announcement. */
export const subscriptionAnnouncementTemplate = ({
  title,
  message,
  link,
  linkLabel,
  unsubscribeUrl,
}) => {
  const cta = link
    ? `<p style="margin:24px 0">
         <a href="${escapeHtml(link)}" style="display:inline-block;background:#5f6FFF;color:#fff;padding:11px 20px;border-radius:999px;text-decoration:none;font-weight:600">
           ${escapeHtml(linkLabel || "Learn more")}
         </a>
       </p>`
    : "";

  return wrap(
    escapeHtml(title),
    `${toParagraphs(message)}
     ${cta}
     <p style="font-size:12px;color:#94a3b8">
       You're receiving this because you subscribed to the Prescripto newsletter.
       <a href="${unsubscribeUrl}" style="color:#4f46e5">Unsubscribe</a>.
     </p>`
  );
};

export default { sendEmail, verifyEmailTransport, getEmailMode, getEmailSettings };