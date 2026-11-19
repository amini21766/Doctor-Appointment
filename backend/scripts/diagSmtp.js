import "dotenv/config";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import EmailSetting from "../models/EmailSetting.js";
import { decryptSecret } from "../utils/secretBox.js";

await mongoose.connect(process.env.MONGODB_URI);

const row = await EmailSetting.findOne({ key: "smtp" }).lean();
if (!row) {
  console.log("NO saved SMTP settings in MongoDB");
  await mongoose.disconnect();
  process.exit(0);
}

const password = decryptSecret(row.password);
console.log("saved settings:");
console.log("  host      :", row.host);
console.log("  port      :", row.port);
console.log("  user      :", row.user);
console.log("  from      :", row.from);
console.log("  password  :", password ? `decrypted, ${password.length} chars, ${/\s/.test(password) ? "CONTAINS SPACES" : "no spaces"}` : "DECRYPT FAILED");
console.log("  format    :", password
  ? `${/^[a-z]{16}$/.test(password) ? "looks like a Gmail App Password (16 lowercase letters)" : "NOT the 16-lowercase-letter App Password format"}${/^[A-Za-z0-9]{16}$/.test(password) ? " (16 alphanumeric)" : ""}`
  : "-");
console.log("  updatedAt :", row.updatedAt);

for (const port of [...new Set([Number(row.port), 465, 587])]) {
  const transport = nodemailer.createTransport({
    host: row.host,
    port,
    secure: port === 465,
    auth: { user: row.user, pass: password },
    connectionTimeout: 12000,
  });
  try {
    await transport.verify();
    console.log(`verify port ${port}: OK`);
  } catch (err) {
    console.log(`verify port ${port}: FAIL -> ${err.message}`);
  } finally {
    transport.close();
  }
}

await mongoose.disconnect();
