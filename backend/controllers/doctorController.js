import { ApiError } from "../middleware/errorMiddleware.js";
import doctorService from "../services/doctorService.js";
import appointmentService from "../services/appointmentService.js";

/** GET /api/doctors  (public) — search / filter / paginate */
export const listDoctors = async (req, res, next) => {
  try {
    const { search, specialty, available, minFee, maxFee, page, limit } = req.query;

    const parsedAvailable =
      available === undefined ? undefined : available === "true" || available === true;

    const result = await doctorService.listDoctors({
      search: search?.trim() || undefined,
      specialty: specialty?.trim() || undefined,
      available: parsedAvailable,
      minFee: minFee !== undefined ? Number(minFee) : undefined,
      maxFee: maxFee !== undefined ? Number(maxFee) : undefined,
      page,
      limit,
    });

    return res.json({
      success: true,
      message: "Doctors fetched successfully",
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/doctors/:id  (public) */
export const getDoctor = async (req, res, next) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    return res.json({ success: true, message: "Doctor fetched successfully", data: doctor });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/doctors/specialty/:specialty  (public) */
export const listBySpecialty = async (req, res, next) => {
  try {
    const result = await doctorService.listDoctors({
      specialty: req.params.specialty,
      page: req.query.page,
      limit: req.query.limit || 50,
    });
    return res.json({
      success: true,
      message: "Doctors fetched successfully",
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/doctors/:id/availability?date=YYYY-MM-DD  (public) */
export const getAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    const availability = await appointmentService.getDoctorDayAvailability(req.params.id, date);
    const upcomingDates = await appointmentService.getAvailableDatesForDoctor(req.params.id);
    return res.json({
      success: true,
      message: "Availability fetched successfully",
      data: { ...availability, upcomingDates },
    });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/doctors/:id/availability  (doctor self or admin) */
export const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Doctors may only edit their own record.
    if (req.user.role === "doctor") {
      const own = await doctorService.getDoctorByUserId(req.user._id);
      if (String(own._id) !== String(id)) {
        throw new ApiError(403, "You can only update your own availability");
      }
    } else if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden");
    }

    const { weeklyAvailability, available } = req.body;
    const doctor = await doctorService.updateDoctor(
      id,
      { weeklyAvailability, available },
      { allowAdminOnlyFields: false }
    );

    return res.json({
      success: true,
      message: "Availability updated successfully",
      data: doctor,
    });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/doctors  (admin only) */
export const createDoctor = async (req, res, next) => {
  try {
    const doctor = await doctorService.createDoctor(req.body);
    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/doctors/:id  (admin, or the doctor editing their own record)
 * A doctor may edit profile fields but NOT admin-only fields (isActive).
 */
export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    let allowAdminOnlyFields = false;

    if (req.user.role === "admin") {
      allowAdminOnlyFields = true;
    } else if (req.user.role === "doctor") {
      const own = await doctorService.getDoctorByUserId(req.user._id);
      if (String(own._id) !== String(id)) {
        throw new ApiError(403, "You can only update your own profile");
      }
    } else {
      throw new ApiError(403, "Forbidden");
    }

    const doctor = await doctorService.updateDoctor(id, req.body, { allowAdminOnlyFields });
    return res.json({ success: true, message: "Doctor updated successfully", data: doctor });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/doctors/:id  (admin only) — soft delete via isActive until no appointments exist */
export const deleteDoctor = async (req, res, next) => {
  try {
    const Appointment = (await import("../models/Appointment.js")).default;
    const Doctor = (await import("../models/Doctor.js")).default;
    const User = (await import("../models/User.js")).default;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw new ApiError(404, "Doctor not found");

    const activeAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      status: "booked",
    });

    if (activeAppointments > 0) {
      // Preserve history: deactivate instead of hard delete.
      doctor.isActive = false;
      doctor.available = false;
      await doctor.save();
      await User.findByIdAndUpdate(doctor.user, { isActive: false });
      return res.json({
        success: true,
        message: "Doctor has active appointments and was deactivated instead of deleted",
        data: doctor,
      });
    }

    await User.findByIdAndDelete(doctor.user);
    await Doctor.findByIdAndDelete(doctor._id);
    return res.json({ success: true, message: "Doctor deleted successfully", data: null });
  } catch (err) {
    return next(err);
  }
};

export default {
  listDoctors,
  getDoctor,
  listBySpecialty,
  getAvailability,
  updateAvailability,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};