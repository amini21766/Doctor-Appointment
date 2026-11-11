import DateSelector from "./DateSelector.jsx";
import TimeSlotSelector from "./TimeSlotSelector.jsx";

export default function AppointmentSlots({
  dates = [],
  slots = [],
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  slotsLoading = false,
  onBook,
  booking = false,
  canBook = false,
  fee,
}) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-base font-semibold text-ink">Booking slots</h3>

      <div className="mt-4">
        <DateSelector dates={dates} selected={selectedDate} onSelect={onSelectDate} />
      </div>

      <div className="mt-6">
        <TimeSlotSelector
          slots={slots}
          selected={selectedTime}
          onSelect={onSelectTime}
          loading={slotsLoading}
        />
      </div>

      <button
        type="button"
        onClick={onBook}
        disabled={!canBook || booking}
        className="btn-primary mt-6 w-full sm:w-auto"
      >
        {booking ? "Booking..." : fee !== undefined ? `Book appointment · $${fee}` : "Book appointment"}
      </button>
    </div>
  );
}