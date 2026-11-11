import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";

/** GET /api/admin/dashboard  (admin) — all stats computed from MongoDB */
export const dashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalAppointments,
      bookedAppointments,
      completedAppointments,
      cancelledAppointments,
      upcomingAppointments,
      revenueAgg,
      recentAppointments,
    ] = await Promise.all([
      Doctor.countDocuments({}),
      Doctor.countDocuments({ isActive: true }),
      User.countDocuments({ role: "patient" }),
      Appointment.countDocuments({}),
      Appointment.countDocuments({ status: "booked" }),
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "cancelled" }),
      Appointment.countDocuments({ status: "booked", appointmentDate: { $gte: today } }),
      Appointment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$fee" } } },
      ]),
      Appointment.find({})
        .populate("patient", "name")
        .populate("doctor", "name")
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    const revenue = revenueAgg[0]?.total || 0;

    return res.json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        totals: {
          doctors: totalDoctors,
          activeDoctors,
          patients: totalPatients,
          appointments: totalAppointments,
          booked: bookedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          upcoming: upcomingAppointments,
        },
        revenue,
        recentAppointments,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/admin/patients  (admin) — search + pagination */
export const listPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { role: "patient" };
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const patients = await User.find(query).sort({ createdAt: -1 });

    // Attach appointment counts.
    const withCounts = await Promise.all(
      patients.map(async (p) => {
        const count = await Appointment.countDocuments({ patient: p._id });
        return { ...p.toSafeJSON(), appointmentCount: count };
      })
    );

    return res.json({ success: true, message: "Patients fetched successfully", data: withCounts });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/admin/patients/:id  (admin) — patient detail + appointment history */
export const getPatient = async (req, res, next) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, role: "patient" });
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found", errors: [] });

    const appointments = await Appointment.find({ patient: patient._id })
      .populate("doctor", "name")
      .sort({ appointmentDate: -1 });

    return res.json({
      success: true,
      message: "Patient fetched successfully",
      data: { patient: patient.toSafeJSON(), appointments },
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/admin/doctors  (admin) — includes inactive doctors */
export const listDoctors = async (req, res, next) => {
  try {
    const { search, specialty } = req.query;
    const query = {};

    if (search) {
      query.name = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    }

    let doctors = await Doctor.find(query)
      .populate("specialty", "name")
      .sort({ createdAt: -1 });

    if (specialty) {
      doctors = doctors.filter(
        (d) => d.specialty?.name?.toLowerCase() === specialty.toLowerCase()
      );
    }

    return res.json({ success: true, message: "Doctors fetched successfully", data: doctors });
  } catch (err) {
    return next(err);
  }
};

/** PATCH /api/admin/doctors/:id/status  (admin) — activate/deactivate */
export const setDoctorStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found", errors: [] });

    doctor.isActive = Boolean(isActive);
    // Deactivation also stops new bookings; reactivation restores availability
    // so a reactivated doctor can be booked again.
    doctor.available = Boolean(isActive);
    await doctor.save();

    await User.findByIdAndUpdate(doctor.user, { isActive: Boolean(isActive) });

    return res.json({
      success: true,
      message: isActive ? "Doctor reactivated" : "Doctor deactivated",
      data: doctor,
    });
  } catch (err) {
    return next(err);
  }
};

export default { dashboard, listPatients, getPatient, listDoctors, setDoctorStatus };