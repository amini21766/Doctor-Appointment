/**
 * Builds the public unsubscribe URL embedded in every newsletter email.
 * Kept in one place so welcome emails and announcements always agree.
 */
export const buildUnsubscribeUrl = (token) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
  return `${clientUrl.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
};

export default buildUnsubscribeUrl;
