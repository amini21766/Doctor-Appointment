/**
 * SMTP smoke test: verifies the connection/credentials and sends one real email.
 *
 * Usage (inside backend/):
 *   npm run email:test                 -> sends to SMTP_USER
 *   npm run email:test -- you@x.com    -> sends to a specific address
 */
import "dotenv/config";
import mongoose from "mongoose";
import {
  getEmailMode,
  getEmailSettings,
  sendEmail,
  verifyEmailTransport,
  subscriptionAnnouncementTemplate,
} from "../services/emailService.js";

// Saved settings live in MongoDB; connect so the script reflects the admin UI.
if (process.env.MONGODB_URI) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[email] MongoDB unavailable, using .env settings only:", err.message);
  }
}

const emailMode = await getEmailMode();
const settings = await getEmailSettings();
const recipient =
  process.argv[2] || process.env.SMTP_USER || (emailMode === "smtp" ? "" : "test@example.com");

const mask = (value) => (value ? `${value.slice(0, 3)}***${value.slice(-2)}` : "(empty)");

const fail = (message) => {
  // eslint-disable-next-line no-console
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
};

// eslint-disable-next-line no-console
console.log(`
SMTP configuration (${settings.source === "db" ? "saved in the admin panel" : settings.source === "env" ? "backend/.env" : "not configured"})
  SMTP_HOST  : ${settings.host || "(empty)"}
  SMTP_PORT  : ${settings.port || "587 (default)"}
  SMTP_USER  : ${mask(settings.user)}
  SMTP_PASS  : ${settings.hasPassword ? "***set***" : "(empty)"}
  EMAIL_FROM : ${settings.from || "(default no-reply@doctorappointment.test)"}
  CLIENT_URL : ${process.env.CLIENT_URL || "http://localhost:5173"}
  mode       : ${emailMode}${emailMode === "smtp" ? " (real inboxes)" : emailMode === "test" ? " (Ethereal test inbox)" : " (backend/outbox .eml files)"}
  recipient  : ${recipient || "(none)"}
`);

if (emailMode === "test") {
  // eslint-disable-next-line no-console
  console.log(
    "ℹ️  No SMTP credentials found: using a free Ethereal test inbox automatically.\n" +
      "   Real addresses are not contacted — a preview link is printed at the end.\n"
  );
} else if (emailMode === "outbox") {
  // eslint-disable-next-line no-console
  console.log(
    "ℹ️  EMAIL_TEST_MODE=off and no SMTP credentials: messages go to backend/outbox as .eml files.\n"
  );
}

if (!recipient) {
  fail("No recipient. Run: npm run email:test -- you@example.com");
}

const verification = await verifyEmailTransport();
if (!verification.ok) {
  fail(
    `SMTP connection failed: ${verification.reason}\n` +
      "   Common causes: wrong host/port, Gmail without an App Password,\n" +
      "   unverified sender domain (EMAIL_FROM), or a blocked port on your host."
  );
}

// eslint-disable-next-line no-console
console.log("✅ Transport connection + authentication OK. Sending a test email...");

const result = await sendEmail({
  to: recipient,
  subject: "Prescripto SMTP test",
  html: subscriptionAnnouncementTemplate({
    title: "SMTP is working 🎉",
    message:
      "This is a test email sent by `npm run email:test`.\n\n" +
      "If you can read this, announcements will now reach your subscribers.",
    link: process.env.CLIENT_URL || "http://localhost:5173",
    linkLabel: "Open the site",
    unsubscribeUrl: `${(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "")}/unsubscribe?token=test-token`,
  }),
  text: "SMTP is working. This is a test email from npm run email:test.",
});

if (!result.sent) {
  fail(`Send failed: ${result.reason}`);
}

if (result.previewUrl) {
  // eslint-disable-next-line no-console
  console.log(
    `✅ Test email generated for ${recipient}.\n` +
      `   Preview: ${result.previewUrl}\n` +
      "   (Ethereal test inbox — nothing was delivered to a real mailbox.)\n"
  );
} else if (result.file) {
  // eslint-disable-next-line no-console
  console.log(`✅ Test email written to backend/outbox/${result.file}\n`);
} else {
  // eslint-disable-next-line no-console
  console.log(`✅ Test email accepted for ${recipient}. Check the inbox (and the spam folder).\n`);
}

// Release the Mongo connection so the script exits promptly.
await mongoose.disconnect();
