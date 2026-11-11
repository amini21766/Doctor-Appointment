import { ApiError } from "../middleware/errorMiddleware.js";
import appointmentService from "../services/appointmentService.js";
import { sendEmail, bookingConfirmationTemplate, cancellationTemplate } from "../services/emailService.js";
import { formatTimeLabel } from "../utils/slotGenerator.js";
import { getDoctorByUserId } from "../services/doctorService.js";

/** POST /api/appointments  (patient only) */
export const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, appointmentTime } = req.body;

    const appointment = await appointmentService.createAppointment({
      patientId: req.user._id,
      doctorId,
      appointmentDate,
      appointmentTime,
    });

    // Fire-and-forget confirmation email (never blocks the response).
    const populated = await appointment.populate("doctor", "name");
    sendEmail({
      to: req.user.email,
      subject: "Appointment confirmed",
      html: bookingConfirmationTemplate({
        patientName: req.user.name,
        doctorName: populated.doctor?.name || "your doctor",
        date: appointmentDate,
        time: formatTimeLabel(appointmentTime),
        fee: appointment.fee,
      }),
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/appointments/my  (patient only) */
export const myAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.listPatientAppointments(req.user._id);
    return res.json({ success: true, message: "Appointments fetched successfully", data: appointments });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/appointments/doctor  (doctor only) */
export const doctorAppointments = async (req, res, next) => {
  try {
    const doctor = await getDoctorByUserId(req.user._id);
    const appointments = await appointmentService.listDoctorAppointments(doctor._id);
    return res.json({ success: true, message: "Appointments fetched successfully", data: appointments });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/appointments/all  (admin only) */
export const allAppointments = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const Appointment = (await import("../models/Appointment.js")).default;
    let appointments = await Appointment.find(query)
      .populate("patient", "name email phone")
      .populate({ path: "doctor", select: "name specialty", populate: { path: "specialty", select: "name" } })
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    if (search) {
      const s = search.toLowerCase();
      appointments = appointments.filter((a) => {
        const p = a.patient?.name?.toLowerCase() || "";
        const d = a.doctor?.name?.toLowerCase() || "";
        const date = a.appointmentDate || "";
        return p.includes(s) || d.includes(s) || date.includes(s);
      });
    }

    return res.json({ success: true, message: "Appointments fetched successfully", data: appointments });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/appointments/:id  (owner or admin) */
export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    appointmentService.assertOwnership(appointment, req.user);
    return res.json({ success: true, message: "Appointment fetched successfully", data: appointment });
  } catch (err) {
    return next(err);
  }
};

/** PATCH /api/appointments/:id/cancel  (owner or admin) */
export const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    appointmentService.assertOwnership(appointment, req.user);

    const updated = await appointmentService.updateAppointmentStatus({
      appointmentId: req.params.id,
      status: "cancelled",
      actor: req.user.role,
    });

    sendEmail({
      to: appointment.patient?.email,
      subject: "Appointment cancelled",
      html: cancellationTemplate({
        name: appointment.patient?.name || "there",
        doctorName: appointment.doctor?.name || "your doctor",
        date: appointment.appointmentDate,
        time: formatTimeLabel(appointment.appointmentTime),
      }),
    });

    return res.json({ success: true, message: "Appointment cancelled successfully", data: updated });
  } catch (err) {
    return next(err);
  }
};

/** PATCH /api/appointments/:id/complete  (doctor owner or admin) */
export const completeAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);

    if (req.user.role === "doctor") {
      const doctor = await getDoctorByUserId(req.user._id);
      if (String(appointment.doctor?._id) !== String(doctor._id)) {
        throw new ApiError(403, "You can only complete your own appointments");
      }
    } else if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden");
    }

    const updated = await appointmentService.updateAppointmentStatus({
      appointmentId: req.params.id,
      status: "completed",
      actor: req.user.role,
    });

    return res.json({ success: true, message: "Appointment marked as completed", data: updated });
  } catch (err) {
    return next(err);
  }
};

export default {
  createAppointment,
  myAppointments,
  doctorAppointments,
  allAppointments,
  getAppointment,
  cancelAppointment,
  completeAppointment,
};