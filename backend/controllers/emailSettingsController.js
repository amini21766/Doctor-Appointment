import { ApiError } from "../middleware/errorMiddleware.js";
import {
  getEmailSettings,
  saveEmailSettings,
  clearEmailSettings,
  verifyEmailTransport,
  recordVerification,
  sendEmail,
} from "../services/emailService.js";

/**
 * Turn provider rejections into actionable advice. Gmail is by far the most
 * common case: it silently rejects account passwords and needs an App Password.
 */
const smtpHint = (reason = "") => {
  const text = String(reason);
  if (/535|BadCredentials|Invalid login|Username and Password not accepted/i.test(text)) {
    return " Hint: mail providers reject normal account passwords. For Gmail, enable 2-Step Verification, create a 16-character App Password at https://myaccount.google.com/apppasswords and paste it as the password.";
  }
  if (/ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNREFUSED/i.test(text)) {
    return " Hint: the host/port could not be reached — check for typos and that outbound SMTP is not blocked by your network or hosting provider (many hosts block port 25/587).";
  }
  if (/self signed certificate|SSL|wrong version number/i.test(text)) {
    return " Hint: the port does not match the encryption. Use 465 for SSL or 587 for STARTTLS.";
  }
  return "";
};

/** Gmail ignores/rejects any From address that is not the authenticated account. */
const fromWarning = (settings = {}) =>
  /gmail\.com$/i.test(String(settings.host || "")) &&
  settings.user &&
  !String(settings.from || "").toLowerCase().includes(String(settings.user).toLowerCase())
    ? ` Gmail only sends from the authenticated address, so set "From address" to ${settings.user}.`
    : "";

/** GET /api/admin/email-settings — current delivery configuration. */
export const readEmailSettings = async (req, res, next) => {
  try {
    const settings = await getEmailSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/admin/email-settings — save SMTP credentials and verify them. */
export const updateEmailSettings = async (req, res, next) => {
  try {
    const { host, port, user, password, from } = req.body || {};

    // The saved password was rejected: refuse to "keep" it and silently fail again.
    if (!password) {
      const current = await getEmailSettings();
      if (
        current.source === "db" &&
        current.verified === false &&
        /535|BadCredentials|Invalid login|Username and Password not accepted/i.test(
          current.lastError || ""
        )
      ) {
        return next(
          new ApiError(
            400,
            "The saved password was rejected by the mail provider. Enter the password (or App Password) again before saving."
          )
        );
      }
    }

    const settings = await saveEmailSettings({
      host,
      port,
      user,
      password,
      from,
      updatedBy: req.user?._id,
    });
    const checked = settings.verification?.ok;
    const baseMessage = checked
      ? "SMTP settings saved and the connection was verified."
      : `SMTP settings saved, but the connection check failed: ${
          settings.verification?.reason || "unknown error"
        }${smtpHint(settings.verification?.reason)}`;
    res.json({
      success: true,
      message: baseMessage + fromWarning(settings),
      data: settings,
    });
  } catch (err) {
    if (err.message === "SMTP password is required") {
      return next(new ApiError(400, "SMTP password is required the first time you save."));
    }
    next(err);
  }
};

/** POST /api/admin/email-settings/test — send a test email with the saved config. */
export const sendTestEmail = async (req, res, next) => {
  try {
    const to = req.body?.to;
    const settings = await getEmailSettings();
    const verification = await verifyEmailTransport();
    if (!verification.ok) {
      await recordVerification(verification);
      throw new ApiError(
        400,
        `Connection failed: ${verification.reason}${smtpHint(verification.reason)}${fromWarning(settings)}`
      );
    }
    await recordVerification({ ok: true });

    const result = await sendEmail({
      to,
      subject: "Prescripto delivery test",
      text: "Your announcement delivery settings work. This is a test message.",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Delivery settings work</h2>
        <p>This is a test message from the Prescripto admin panel.</p>
        <p style="font-size:12px;color:#64748b">Mode: ${result.mode || settings.mode}</p>
      </div>`,
    });

    if (!result.sent) {
      throw new ApiError(400, `Test email failed: ${result.reason}${smtpHint(result.reason)}`);
    }

    res.json({
      success: true,
      message: `${result.mode === "test" ? "Test email generated in the Ethereal test inbox." : "Test email sent to the provider — check the recipient inbox (and spam)."}${fromWarning(settings)}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/admin/email-settings — remove saved credentials. */
export const deleteEmailSettings = async (req, res, next) => {
  try {
    const settings = await clearEmailSettings();
    res.json({
      success: true,
      message: "Saved SMTP settings removed. Delivery falls back to the default mode.",
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};
