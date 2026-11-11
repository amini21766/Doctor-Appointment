import EmptyState from "./EmptyState.jsx";

/**
 * Renders the available time slots for the selected date.
 * Slots come from the backend (already filtered for past + booked times).
 */
export default function TimeSlotSelector({ slots = [], selected, onSelect, loading = false }) {
  if (loading) {
    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="h-9 w-20 animate-pulse rounded-full bg-slate-200" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <EmptyState
        icon="⏰"
        title="No available slots"
        message="There are no free time slots for this date. Please choose another day."
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {slots.map((slot) => {
        const isActive = selected === slot.value;
        return (
          <button
            key={slot.value}
            type="button"
            onClick={() => onSelect(slot.value)}
            aria-pressed={isActive}
            className={`rounded-full border px-5 py-2 text-sm transition ${
              isActive
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
            }`}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}