import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { ApiError } from "../middleware/errorMiddleware.js";
import {
  DAY_NAMES,
  getAvailableSlots,
  isPast,
  toDateString,
} from "../utils/slotGenerator.js";

const STATUS_TRANSITIONS = {
  booked: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Validate a "YYYY-MM-DD" date string. */
const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Normalize time "h:mm" / "HH:mm" to 24h "HH:mm". */
const normalizeTime = (value) => {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const createAppointment = async ({ patientId, doctorId, appointmentDate, appointmentTime }) => {
  if (!doctorId) throw new ApiError(400, "Doctor is required");
  if (!isValidDateString(appointmentDate)) throw new ApiError(400, "Invalid appointment date");

  const time = normalizeTime(appointmentTime);
  if (!time) throw new ApiError(400, "Invalid appointment time");

  // 1. Verify doctor exists & is active
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");
  if (!doctor.isActive) throw new ApiError(400, "This doctor is no longer available");
  if (!doctor.available) throw new ApiError(400, "This doctor is currently not accepting appointments");

  // 2. Validate date is not in the past
  const dayName = DAY_NAMES[new Date(`${appointmentDate}T00:00:00.000Z`).getUTCDay()];
  if (isPast(appointmentDate, time)) {
    throw new ApiError(400, "Cannot book an appointment in the past");
  }

  // 3. Validate the day is enabled and the time falls within availability
  const dayConfig = doctor.weeklyAvailability?.[dayName];
  if (!dayConfig || !dayConfig.enabled) {
    throw new ApiError(400, `Doctor is not available on ${dayName}`);
  }

  // 4. Fetch already-booked slots for that day
  const booked = await Appointment.find({
    doctor: doctor._id,
    appointmentDate,
    status: { $in: ["booked", "completed"] },
  }).select("appointmentTime");

  const availableSlots = getAvailableSlots({
    dateStr: appointmentDate,
    dayName,
    weeklyAvailability: doctor.weeklyAvailability,
    bookedSlots: booked.map((b) => b.appointmentTime),
  });

  const isAllowed = availableSlots.some((s) => s.value === time);
  if (!isAllowed) {
    throw new ApiError(409, "This appointment slot is no longer available.");
  }

  // 5. Create appointment. The unique partial index is the final guard
  //    against a race condition between two simultaneous bookings.
  try {
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctor._id,
      appointmentDate,
      appointmentTime: time,
      fee: doctor.fees,
      status: "booked",
      paymentStatus: "unpaid",
    });
    return appointment;
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "This appointment slot is no longer available.");
    }
    throw err;
  }
};

export const listPatientAppointments = async (patientId) => {
  return Appointment.find({ patient: patientId })
    .populate({ path: "doctor", populate: { path: "specialty", select: "name" } })
    .sort({ appointmentDate: -1, appointmentTime: -1 });
};

export const listDoctorAppointments = async (doctorId) => {
  return Appointment.find({ doctor: doctorId })
    .populate("patient", "name email phone profileImage")
    .sort({ appointmentDate: -1, appointmentTime: -1 });
};

export const getAppointmentById = async (id) => {
  const appointment = await Appointment.findById(id)
    .populate("patient", "name email phone profileImage")
    .populate({ path: "doctor", populate: { path: "specialty", select: "name" } });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  return appointment;
};

export const assertOwnership = (appointment, user) => {
  if (user.role === "admin") return;
  if (user.role === "patient" && String(appointment.patient?._id || appointment.patient) === String(user._id)) return;
  if (user.role === "doctor" && String(appointment.doctor?._id || appointment.doctor) === String(user._id)) return;
  throw new ApiError(403, "You are not allowed to access this appointment");
};

export const updateAppointmentStatus = async ({ appointmentId, status, actor }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (!STATUS_TRANSITIONS[appointment.status]?.includes(status)) {
    throw new ApiError(400, `Cannot change status from ${appointment.status} to ${status}`);
  }

  appointment.status = status;
  if (status === "cancelled") {
    appointment.cancelledBy = actor;
    if (appointment.paymentStatus === "paid") appointment.paymentStatus = "refunded";
  }
  await appointment.save();
  return appointment;
};

export const getDoctorDayAvailability = async (doctorId, dateStr) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const date = dateStr || toDateString(new Date());
  const dayName = DAY_NAMES[new Date(`${date}T00:00:00.000Z`).getUTCDay()];

  const booked = await Appointment.find({
    doctor: doctor._id,
    appointmentDate: date,
    status: { $in: ["booked", "completed"] },
  }).select("appointmentTime");

  const slots = getAvailableSlots({
    dateStr: date,
    dayName,
    weeklyAvailability: doctor.weeklyAvailability,
    bookedSlots: booked.map((b) => b.appointmentTime),
  });

  return { date, dayName, slots };
};

export const getAvailableDatesForDoctor = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const now = new Date();
  const result = [];
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    const dateStr = toDateString(d);
    const dayName = DAY_NAMES[d.getUTCDay()];
    const dayConfig = doctor.weeklyAvailability?.[dayName];
    if (dayConfig?.enabled) {
      result.push({
        date: dateStr,
        dayName,
        dayOfMonth: d.getUTCDate(),
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
      });
    }
  }
  return result;
};

export default {
  createAppointment,
  listPatientAppointments,
  listDoctorAppointments,
  getAppointmentById,
  assertOwnership,
  updateAppointmentStatus,
  getDoctorDayAvailability,
  getAvailableDatesForDoctor,
};