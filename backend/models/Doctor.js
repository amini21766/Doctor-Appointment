import mongoose from "mongoose";

const dayAvailabilitySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: "10:00" },
    endTime: { type: String, default: "17:00" },
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