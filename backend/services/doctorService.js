import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Specialty from "../models/Specialty.js";
import { ApiError } from "../middleware/errorMiddleware.js";

/** Escape a user string for safe use inside a RegExp. */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build a MongoDB query from search / filter params.
 * Only active doctors are ever returned by the public listing.
 */
export const buildDoctorQuery = async ({ search, specialty, available, minFee, maxFee }) => {
  const query = { isActive: true };

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    // Match doctor name OR specialty name.
    const matchingSpecialties = await Specialty.find({ name: regex }).select("_id");
    query.$or = [
      { name: regex },
      { specialty: { $in: matchingSpecialties.map((s) => s._id) } },
    ];
  }

  if (specialty) {
    const spec = await Specialty.findOne({ name: new RegExp(`^${escapeRegex(specialty)}$`, "i") });
    // If the specialty does not exist, force an empty, valid result set.
    query.specialty = spec ? spec._id : new Specialty()._id;
  }

  if (typeof available === "boolean") {
    query.available = available;
  }

  if (minFee !== undefined || maxFee !== undefined) {
    query.fees = {};
    if (minFee !== undefined && !Number.isNaN(minFee)) query.fees.$gte = minFee;
    if (maxFee !== undefined && !Number.isNaN(maxFee)) query.fees.$lte = maxFee;
  }

  return query;
};

/** Paginated doctor listing with populated specialty. */
export const listDoctors = async (params) => {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 12));
  const skip = (page - 1) * limit;

  const query = await buildDoctorQuery(params);

  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .populate("specialty", "name icon")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments(query),
  ]);

  return {
    data: doctors,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getDoctorById = async (id) => {
  const doctor = await Doctor.findById(id).populate("specialty", "name icon");
  if (!doctor) throw new ApiError(404, "Doctor not found");
  return doctor;
};

export const getDoctorByUserId = async (userId) => {
  const doctor = await Doctor.findOne({ user: userId }).populate("specialty", "name icon");
  if (!doctor) throw new ApiError(404, "Doctor profile not found for this account");
  return doctor;
};

/**
 * Create a doctor + linked user account (admin only).
 */
export const createDoctor = async (payload) => {
  const {
    name, email, password, phone, specialtyName, specialty, degree, experience,
    about, fees, address, image, available, weeklyAvailability,
  } = payload;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  // Resolve specialty by id or by name.
  let specialtyDoc = null;
  if (specialty) specialtyDoc = await Specialty.findById(specialty);
  else if (specialtyName) specialtyDoc = await Specialty.findOne({ name: new RegExp(`^${escapeRegex(specialtyName)}$`, "i") });
  if (!specialtyDoc) throw new ApiError(400, "A valid specialty is required");

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || "",
    role: "doctor",
    profileImage: image || "",
  });

  const doctor = await Doctor.create({
    user: user._id,
    name,
    email: email.toLowerCase(),
    image: image || "",
    specialty: specialtyDoc._id,
    degree: degree || "MBBS",
    experience: experience || "1 Year",
    about: about || "",
    fees: fees ?? 50,
    address: address || "",
    available: available ?? true,
    isActive: true,
    weeklyAvailability: weeklyAvailability || defaultWeeklyAvailability(),
  });

  return Doctor.findById(doctor._id).populate("specialty", "name icon");
};

/** Default Mon–Sat availability used when none is supplied. */
export const defaultWeeklyAvailability = () => {
  const weekday = { enabled: true, startTime: "10:00", endTime: "17:00" };
  const weekend = { enabled: true, startTime: "09:00", endTime: "13:00" };
  return {
    Monday: { ...weekday },
    Tuesday: { ...weekday },
    Wednesday: { ...weekday },
    Thursday: { ...weekday },
    Friday: { ...weekday },
    Saturday: { ...weekend },
    Sunday: { enabled: false, startTime: "10:00", endTime: "17:00" },
  };
};

/**
 * Update a doctor. `allowAdminOnlyFields` gates isActive/available changes
 * so a doctor cannot deactivate themselves through the doctor routes.
 */
export const updateDoctor = async (id, payload, { allowAdminOnlyFields = false } = {}) => {
  const doctor = await Doctor.findById(id);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  const editable = [
    "name", "degree", "experience", "about", "fees", "address", "image", "available",
  ];
  for (const field of editable) {
    if (payload[field] !== undefined) doctor[field] = payload[field];
  }

  if (payload.specialty !== undefined) {
    const spec = await Specialty.findById(payload.specialty);
    if (!spec) throw new ApiError(400, "Invalid specialty");
    doctor.specialty = spec._id;
  }

  if (payload.weeklyAvailability !== undefined) {
    doctor.weeklyAvailability = payload.weeklyAvailability;
  }

  if (allowAdminOnlyFields && payload.isActive !== undefined) {
    doctor.isActive = payload.isActive;
    // Keep the linked user account in sync.
    await User.findByIdAndUpdate(doctor.user, { isActive: payload.isActive });
  }

  await doctor.save();
  return Doctor.findById(doctor._id).populate("specialty", "name icon");
};

export default {
  buildDoctorQuery,
  listDoctors,
  getDoctorById,
  getDoctorByUserId,
  createDoctor,
  updateDoctor,
  defaultWeeklyAvailability,
};