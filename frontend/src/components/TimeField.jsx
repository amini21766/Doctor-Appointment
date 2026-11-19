import { useEffect, useRef, useState } from "react";
import { FiClock } from "react-icons/fi";

const pad = (value) => String(value).padStart(2, "0");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Parse "HH:mm" into numbers, falling back to 09:00 for malformed input. */
export const parseTime = (value) => {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(String(value ?? "").trim());
  if (!match) return { hour: 9, minute: 0 };
  return {
    hour: Math.min(23, Math.max(0, Number(match[1]))),
    minute: Math.min(59, Math.max(0, Number(match[2]))),
  };
};

/** Numbers back to "HH:mm" (what the API expects). */
export const toTimeValue = ({ hour, minute }) => `${pad(hour)}:${pad(minute)}`;

/** "9:05 pm" — compact 12-hour label. */
export const formatClock = (value) => {
  const { hour, minute } = parseTime(value);
  const suffix = hour < 12 ? "am" : "pm";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${pad(minute)} ${suffix}`;
};

/** "7h", "1h 30m", "45m" — used next to each time block. */
export const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

/** 24h "HH:mm" → editable 12h parts. */
const toParts = (value) => {
  const { hour, minute } = parseTime(value);
  return {
    hourText: String(hour % 12 === 0 ? 12 : hour % 12),
    minuteText: pad(minute),
    period: hour >= 12 ? "pm" : "am",
  };
};

/** 12h parts → 24h "HH:mm". */
const toValue = (hourText, minuteText, period) => {
  const hour12 = clamp(Number(hourText) || 12, 1, 12);
  const minute = clamp(Number(minuteText) || 0, 0, 59);
  const hour = period === "pm" ? (hour12 % 12) + 12 : hour12 % 12;
  return toTimeValue({ hour, minute });
};

/**
 * Inline time field: `[ 09 ] : [ 30 ] [am|pm]`.
 * Type the digits, use ↑/↓ to nudge, or tap am/pm. No popovers, no native menus.
 */
export default function TimeField({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  invalid = false,
  minuteStep = 5,
}) {
  const [hourText, setHourText] = useState(() => toParts(value).hourText);
  const [minuteText, setMinuteText] = useState(() => toParts(value).minuteText);
  const focusedRef = useRef(false);

  const { period } = toParts(value);
  const localValue = toValue(hourText, minuteText, period);

  // Keep the inputs honest when the value changes from the outside (discard, copy to all days).
  useEffect(() => {
    if (focusedRef.current || localValue === value) return;
    const next = toParts(value);
    setHourText(next.hourText);
    setMinuteText(next.minuteText);
  }, [value, localValue]);

  const commit = (nextHourText, nextMinuteText, nextPeriod = period) => {
    onChange(toValue(nextHourText, nextMinuteText, nextPeriod));
  };

  const handleHourChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
    setHourText(digits);
    const parsed = Number(digits);
    if (digits && parsed >= 1 && parsed <= 12) commit(digits, minuteText || "0");
  };

  const handleMinuteChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
    setMinuteText(digits);
    if (digits && Number(digits) <= 59) commit(hourText || "12", digits);
  };

  const normalizeHour = () => {
    const safe = hourText === "" ? 12 : clamp(Number(hourText), 1, 12);
    setHourText(String(safe));
    commit(String(safe), minuteText || "0");
  };

  const normalizeMinute = () => {
    const safe = minuteText === "" ? 0 : clamp(Number(minuteText), 0, 59);
    setMinuteText(pad(safe));
    commit(hourText || "12", String(safe));
  };

  const stepHour = (delta) => {
    const current = clamp(Number(hourText) || 12, 1, 12);
    const next = current + delta > 12 ? 1 : current + delta < 1 ? 12 : current + delta;
    setHourText(String(next));
    commit(String(next), minuteText || "0");
  };

  const stepMinute = (delta) => {
    const step = Math.max(1, Number(minuteStep) || 5);
    const current = clamp(Number(minuteText) || 0, 0, 59);
    const next = (((current + delta * step) % 60) + 60) % 60;
    setMinuteText(pad(next));
    commit(hourText || "12", String(next));
  };

  const applyPeriod = (nextPeriod) => {
    if (nextPeriod === period) return;
    const hour12 = clamp(Number(hourText) || 12, 1, 12);
    const minute = clamp(Number(minuteText) || 0, 0, 59);
    setHourText(String(hour12));
    setMinuteText(pad(minute));
    commit(String(hour12), String(minute), nextPeriod);
  };

  const handleKeyDown = (event, kind) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const delta = event.key === "ArrowUp" ? 1 : -1;
      if (kind === "hour") stepHour(delta);
      else stepMinute(delta);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const inputClass =
    "h-8 w-7 rounded bg-transparent py-0 text-center font-medium tabular-nums outline-none disabled:cursor-not-allowed";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      onFocusCapture={() => {
        focusedRef.current = true;
      }}
      onBlurCapture={() => {
        focusedRef.current = false;
      }}
      className={`inline-flex min-h-10 items-center gap-1 rounded-lg border bg-white px-2 py-1.5 text-sm transition focus-within:ring-2 ${
        invalid
          ? "border-rose-300 bg-rose-50 text-rose-700 focus-within:border-rose-400 focus-within:ring-rose-100"
          : "border-slate-300 text-ink focus-within:border-primary focus-within:ring-primary/20"
      } ${disabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : ""}`}
    >
      <FiClock
        className={`h-3.5 w-3.5 shrink-0 ${invalid ? "text-rose-400" : "text-slate-400"}`}
        aria-hidden="true"
      />
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={2}
        disabled={disabled}
        value={hourText}
        onChange={handleHourChange}
        onBlur={normalizeHour}
        onKeyDown={(event) => handleKeyDown(event, "hour")}
        onFocus={(event) => event.target.select()}
        aria-label={`${ariaLabel} hour`}
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
      <span className={`-mx-0.5 ${invalid ? "text-rose-300" : "text-slate-400"}`} aria-hidden="true">
        :
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        maxLength={2}
        disabled={disabled}
        value={minuteText}
        onChange={handleMinuteChange}
        onBlur={normalizeMinute}
        onKeyDown={(event) => handleKeyDown(event, "minute")}
        onFocus={(event) => event.target.select()}
        aria-label={`${ariaLabel} minute`}
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
      <div
        className={`ml-0.5 flex items-center rounded-full p-0.5 ${invalid ? "bg-rose-100" : "bg-slate-100"}`}
      >
        {["am", "pm"].map((next) => (
          <button
            key={next}
            type="button"
            disabled={disabled}
            onClick={() => applyPeriod(next)}
            aria-label={`${ariaLabel} ${next}`}
            aria-pressed={period === next}
            className={`inline-flex min-h-8 items-center rounded-full px-2.5 text-[11px] font-semibold uppercase transition ${
              period === next
                ? `bg-white shadow-sm ${invalid ? "text-rose-700" : "text-ink"}`
                : `text-slate-500 ${disabled ? "" : "hover:text-ink"}`
            } disabled:cursor-not-allowed`}
          >
            {next}
          </button>
        ))}
      </div>
    </div>
  );
}
