import { buildUpcomingDates } from "../utils/format.js";

/**
 * Horizontal date picker. Dates are generated dynamically from today —
 * never hardcoded — and only days the doctor is available are shown.
 */
export default function DateSelector({ selected, onSelect, dates }) {
  const fallback = buildUpcomingDates(7);
  const list = (dates && dates.length ? dates : fallback).map((d) => ({
    date: d.date,
    dayName: (d.dayName || "").slice(0, 3).toUpperCase(),
    dayOfMonth: d.dayOfMonth,
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
      {list.map((d) => {
        const isActive = selected === d.date;
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onSelect(d.date)}
            aria-pressed={isActive}
            className={`flex min-w-[62px] flex-col items-center rounded-full border px-4 py-2 text-xs font-medium transition ${
              isActive
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary"
            }`}
          >
            <span>{d.dayName}</span>
            <span className="text-base font-semibold">{d.dayOfMonth}</span>
          </button>
        );
      })}
    </div>
  );
}