import nodemailer from "nodemailer";

const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Send an email. Never throws so email issues never break core flows.
 * Returns { sent: boolean, reason?: string }.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn(`[email] SMTP not configured, skipping email to ${to} (subject: ${subject})`);
    return { sent: false, reason: "SMTP not configured" };
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@doctorappointment.test",
      to,
      subject,
      html,
      text,
    });
    return { sent: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[email] Failed to send:", err.message);
    return { sent: false, reason: err.message };
  }
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

export const emailConfigured = isConfigured;

export default { sendEmail, emailConfigured };