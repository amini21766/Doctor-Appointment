/**
 * Slot generation utilities.
 *
 * Timezone strategy:
 *  - Dates are represented as normalized "YYYY-MM-DD" strings.
 *  - Times are represented as normalized 24h "HH:mm" strings.
 *  - All slot math is done on plain strings so the browser's local timezone
 *    never shifts an appointment. The server is the source of truth.
 */

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const SLOT_INTERVAL_MINUTES = 30;

/** Convert "HH:mm" to minutes since midnight. */
export const toMinutes = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  return h * 60 + m;
};

/** Convert minutes since midnight to "HH:mm". */
export const toTimeString = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Format "HH:mm" into a 12h label such as "10:30 am". */
export const formatTimeLabel = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

/** Normalize a Date to a "YYYY-MM-DD" string using UTC parts. */
export const toDateString = (date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Build the next `count` days starting from today (UTC). */
export const getUpcomingDates = (count = 7, from = new Date()) => {
  const dates = [];
  const base = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    dates.push({
      date: toDateString(d),
      dayName: DAY_NAMES[d.getUTCDay()],
      dayOfMonth: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      year: d.getUTCFullYear(),
    });
  }
  return dates;
};

/** Determine whether a given date/time is in the past (UTC). */
export const isPast = (dateStr, timeStr, now = new Date()) => {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const slot = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  return slot < now.getTime();
};

/** Build the raw slot list ("HH:mm") for a day availability config. */
export const buildSlotsForDay = (dayConfig, intervalMinutes = SLOT_INTERVAL_MINUTES) => {
  if (!dayConfig || !dayConfig.enabled) return [];
  const start = toMinutes(dayConfig.startTime || "10:00");
  const end = toMinutes(dayConfig.endTime || "17:00");
  const slots = [];
  for (let m = start; m + intervalMinutes <= end; m += intervalMinutes) {
    slots.push(toTimeString(m));
  }
  return slots;
};

/**
 * Compute available slots for a doctor on a given date.
 * Removes past times and already-booked slots.
 */
export const getAvailableSlots = ({
  dateStr,
  dayName,
  weeklyAvailability,
  bookedSlots = [],
  now = new Date(),
  intervalMinutes = SLOT_INTERVAL_MINUTES,
}) => {
  const dayConfig = weeklyAvailability?.[dayName];
  const baseSlots = buildSlotsForDay(dayConfig, intervalMinutes);
  const booked = new Set(bookedSlots);

  return baseSlots
    .filter((slot) => !booked.has(slot))
    .filter((slot) => !isPast(dateStr, slot, now))
    .map((slot) => ({ value: slot, label: formatTimeLabel(slot) }));
};

export default {
  DAY_NAMES,
  SLOT_INTERVAL_MINUTES,
  toMinutes,
  toTimeString,
  formatTimeLabel,
  toDateString,
  getUpcomingDates,
  isPast,
  buildSlotsForDay,
  getAvailableSlots,
};