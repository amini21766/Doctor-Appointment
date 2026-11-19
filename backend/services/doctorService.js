import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Specialty from "../models/Specialty.js";
import { ApiError } from "../middleware/errorMiddleware.js";
import {
  SLOT_INTERVAL_MINUTES,
  MIN_SLOT_MINUTES,
  MAX_SLOT_MINUTES,
  isValidTime,
  toMinutes,
} from "../utils/slotGenerator.js";

/** Escape a user string for safe use inside a RegExp. */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const AVAILABILITY_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MAX_SESSIONS_PER_DAY = 6;

/** Turn a mongoose subdocument (or plain object) into a plain object. */
const toPlain = (value) => (typeof value?.toObject === "function" ? value.toObject() : value ?? {});

/**
 * Validate + normalize a single weekday.
 * Enabled days are validated strictly; disabled days simply drop unusable
 * blocks so a doctor can park a schedule without being blocked on save.
 *
 * Precedence for the time blocks:
 *   1. an explicit `sessions` array in the payload (empty array = no blocks),
 *   2. an explicit legacy `startTime`/`endTime` pair,
 *   3. the stored values for that day.
 */
const normalizeDayAvailability = (day, rawDay, baseDay) => {
  const patch = toPlain(rawDay);
  const base = toPlain(baseDay);

  const enabled = patch.enabled === undefined ? Boolean(base.enabled) : Boolean(patch.enabled);

  let rawSessions;
  if (Array.isArray(patch.sessions)) {
    rawSessions = patch.sessions;
  } else if (patch.startTime !== undefined || patch.endTime !== undefined) {
    rawSessions = [{ startTime: patch.startTime, endTime: patch.endTime }];
  } else if (Array.isArray(base.sessions) && base.sessions.length) {
    rawSessions = base.sessions;
  } else {
    rawSessions = [{ startTime: base.startTime, endTime: base.endTime }];
  }

  if (enabled && rawSessions.length > MAX_SESSIONS_PER_DAY) {
    throw new ApiError(400, `${day}: use at most ${MAX_SESSIONS_PER_DAY} time blocks`);
  }

  const sessions = [];
  for (const session of rawSessions.slice(0, MAX_SESSIONS_PER_DAY)) {
    const startTime = String(session?.startTime ?? "").trim();
    const endTime = String(session?.endTime ?? "").trim();
    if (!startTime && !endTime) continue; // blank row

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      if (enabled) throw new ApiError(400, `${day}: use valid 24h times (HH:mm)`);
      continue;
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      if (enabled) throw new ApiError(400, `${day}: the end time must be after the start time`);
      continue;
    }
    sessions.push({ startTime, endTime });
  }

  if (enabled && sessions.length === 0) {
    throw new ApiError(400, `${day}: add at least one time block or turn the day off`);
  }

  sessions.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  for (let i = 1; i < sessions.length; i += 1) {
    if (toMinutes(sessions[i].startTime) < toMinutes(sessions[i - 1].endTime)) {
      if (enabled) throw new ApiError(400, `${day}: time blocks cannot overlap`);
    }
  }

  const slotDurationInput = patch.slotDuration !== undefined ? patch.slotDuration : base.slotDuration;
  let slotDuration = Number(slotDurationInput);
  if (slotDurationInput === undefined || slotDurationInput === null || slotDurationInput === "" || !Number.isFinite(slotDuration)) {
    slotDuration = SLOT_INTERVAL_MINUTES;
  } else if (enabled && (slotDuration < MIN_SLOT_MINUTES || slotDuration > MAX_SLOT_MINUTES)) {
    throw new ApiError(
      400,
      `${day}: appointment length must be between ${MIN_SLOT_MINUTES} and ${MAX_SLOT_MINUTES} minutes`
    );
  } else {
    slotDuration = Math.min(MAX_SLOT_MINUTES, Math.max(MIN_SLOT_MINUTES, Math.round(slotDuration)));
  }

  return {
    enabled,
    sessions,
    // Legacy mirrors of the first block, kept for older clients.
    startTime: sessions[0]?.startTime ?? "10:00",
    endTime: sessions[0]?.endTime ?? "17:00",
    slotDuration,
  };
};

/**
 * Normalize a whole week of availability.
 * Days missing from `input` fall back to `base` (the stored schedule), so a
 * partial update never silently wipes the rest of the week.
 */
export const normalizeWeeklyAvailability = (input, base = {}) => {
  if (input === undefined) return undefined;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(400, "weeklyAvailability must be an object keyed by weekday");
  }

  const normalized = {};
  for (const day of AVAILABILITY_DAYS) {
    normalized[day] = normalizeDayAvailability(day, input?.[day], base?.[day]);
  }
  return normalized;
};


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
    weeklyAvailability: normalizeWeeklyAvailability(weeklyAvailability ?? defaultWeeklyAvailability()),
  });

  return Doctor.findById(doctor._id).populate("specialty", "name icon");
};

/** Default Mon–Sat availability used when none is supplied. */
export const defaultWeeklyAvailability = () => {
  const weekday = {
    enabled: true,
    sessions: [{ startTime: "10:00", endTime: "17:00" }],
    startTime: "10:00",
    endTime: "17:00",
    slotDuration: 30,
  };
  const weekend = {
    enabled: true,
    sessions: [{ startTime: "09:00", endTime: "13:00" }],
    startTime: "09:00",
    endTime: "13:00",
    slotDuration: 30,
  };
  return {
    Monday: { ...weekday, sessions: [...weekday.sessions] },
    Tuesday: { ...weekday, sessions: [...weekday.sessions] },
    Wednesday: { ...weekday, sessions: [...weekday.sessions] },
    Thursday: { ...weekday, sessions: [...weekday.sessions] },
    Friday: { ...weekday, sessions: [...weekday.sessions] },
    Saturday: { ...weekend, sessions: [...weekend.sessions] },
    Sunday: { enabled: false, sessions: [{ startTime: "10:00", endTime: "17:00" }], startTime: "10:00", endTime: "17:00", slotDuration: 30 },
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
    // Merge with the stored schedule so a partial payload keeps other days.
    doctor.weeklyAvailability = normalizeWeeklyAvailability(
      payload.weeklyAvailability,
      doctor.weeklyAvailability
    );
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
  normalizeWeeklyAvailability,
  AVAILABILITY_DAYS,
};