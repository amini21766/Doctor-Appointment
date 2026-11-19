import crypto from "crypto";

/**
 * Symmetric encryption for secrets stored in MongoDB (currently the SMTP
 * password). AES-256-GCM with a key derived from JWT_SECRET, so the value is
 * useless without the server's environment.
 */
const KEY = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET || "doctor-appointment-development-secret")
  .digest();

export const encryptSecret = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
};

export const decryptSecret = (payload) => {
  try {
    const [version, iv, tag, data] = String(payload || "").split(":");
    if (version !== "v1") return String(payload || ""); // legacy plaintext value
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
};

export default { encryptSecret, decryptSecret };
