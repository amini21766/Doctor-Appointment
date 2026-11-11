export const currency = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/** Format a "YYYY-MM-DD" string without timezone drift. */
export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
};

/** Format "HH:mm" to "10:30 am". */
export const formatTimeLabel = (value) => {
  if (!value) return "";
  const [h, m] = String(value).split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

/** Build the next `count` days from today, computed in UTC. */
export const buildUpcomingDates = (count = 7) => {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out.push({
      date: d.toISOString().slice(0, 10),
      dayName: DAYS_SHORT[d.getUTCDay()],
      dayOfMonth: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
    });
  }
  return out;
};

/** Classify an appointment relative to now (date + time, UTC). */
export const appointmentPhase = (appointmentDate, appointmentTime) => {
  const now = Date.now();
  const [y, mo, d] = String(appointmentDate).split("-").map(Number);
  const [h, mi] = String(appointmentTime || "00:00").split(":").map(Number);
  const ts = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  return ts >= now ? "upcoming" : "past";
};

export const classNames = (...parts) => parts.filter(Boolean).join(" ");

export default {
  currency,
  formatDate,
  formatTimeLabel,
  buildUpcomingDates,
  appointmentPhase,
  classNames,
};