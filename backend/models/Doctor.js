import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    startTime: { type: String, default: "10:00" },
    endTime: { type: String, default: "17:00" },
  },
  { _id: false }
);

const dayAvailabilitySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    // Kept in sync with sessions[0] so older clients keep working.
    startTime: { type: String, default: "10:00" },
    endTime: { type: String, default: "17:00" },
    // One or more bookable blocks per day (e.g. 09:00-13:00 and 16:00-20:00).
    sessions: { type: [sessionSchema], default: undefined },
    // Appointment length in minutes for this day.
    slotDuration: { type: Number, default: 30, min: 5, max: 240 },
  },
  { _id: false }
);

const weeklyAvailabilitySchema = new mongoose.Schema(
  {
    Monday: { type: dayAvailabilitySchema, default: () => ({}) },
    Tuesday: { type: dayAvailabilitySchema, default: () => ({}) },
    Wednesday: { type: dayAvailabilitySchema, default: () => ({}) },
    Thursday: { type: dayAvailabilitySchema, default: () => ({}) },
    Friday: { type: dayAvailabilitySchema, default: () => ({}) },
    Saturday: { type: dayAvailabilitySchema, default: () => ({}) },
    Sunday: { type: dayAvailabilitySchema, default: () => ({}) },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    image: { type: String, default: "" },
    specialty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
      required: true,
    },
    degree: { type: String, default: "MBBS" },
    experience: { type: String, default: "1 Year" },
    about: { type: String, default: "" },
    fees: { type: Number, default: 50, min: 0 },
    address: { type: String, default: "" },
    available: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    weeklyAvailability: {
      type: weeklyAvailabilitySchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

doctorSchema.index({ name: "text", about: "text" });
doctorSchema.index({ specialty: 1, available: 1 });

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;