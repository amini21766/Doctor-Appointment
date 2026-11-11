import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    // Stored as a normalized "YYYY-MM-DD" string to avoid timezone drift.
    appointmentDate: {
      type: String,
      required: [true, "Appointment date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Appointment date must be YYYY-MM-DD"],
    },
    // Stored as a normalized 24h "HH:mm" string.
    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required"],
      match: [/^\d{2}:\d{2}$/, "Appointment time must be HH:mm"],
    },
    status: {
      type: String,
      enum: ["booked", "completed", "cancelled"],
      default: "booked",
      index: true,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin", null],
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Double-booking protection.
 *
 * A unique partial index on (doctor, appointmentDate, appointmentTime) for
 * active (booked/completed) appointments guarantees that MongoDB itself
 * rejects a second booking of the same slot, even under concurrent requests.
 * Cancelled appointments are excluded so the slot frees up again.
 */
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["booked", "completed"] } },
    name: "unique_active_slot",
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;