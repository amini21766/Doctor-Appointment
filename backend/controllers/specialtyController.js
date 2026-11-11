import Specialty from "../models/Specialty.js";
import Doctor from "../models/Doctor.js";
import { ApiError } from "../middleware/errorMiddleware.js";

/** GET /api/specialties  (public) — optionally include inactive with ?all=true for admin */
export const listSpecialties = async (req, res, next) => {
  try {
    const includeInactive = req.query.all === "true" && req.user?.role === "admin";
    const query = includeInactive ? {} : { active: true };

    const specialties = await Specialty.find(query).sort({ name: 1 });

    // Attach live doctor counts so the UI can show "N doctors".
    const withCounts = await Promise.all(
      specialties.map(async (s) => {
        const count = await Doctor.countDocuments({ specialty: s._id, isActive: true });
        return { ...s.toObject(), doctorCount: count };
      })
    );

    return res.json({
      success: true,
      message: "Specialties fetched successfully",
      data: withCounts,
    });
  } catch (err) {
    return next(err);
  }
};

/** POST /api/specialties  (admin only) */
export const createSpecialty = async (req, res, next) => {
  try {
    const { name, description, icon, active } = req.body;
    if (!name || !String(name).trim()) {
      throw new ApiError(400, "Specialty name is required");
    }

    const exists = await Specialty.findOne({ name: new RegExp(`^${name.trim()}$`, "i") });
    if (exists) throw new ApiError(409, "A specialty with this name already exists");

    const specialty = await Specialty.create({
      name: name.trim(),
      description: description || "",
      icon: icon || "",
      active: active ?? true,
    });

    return res.status(201).json({
      success: true,
      message: "Specialty created successfully",
      data: specialty,
    });
  } catch (err) {
    return next(err);
  }
};

/** PUT /api/specialties/:id  (admin only) */
export const updateSpecialty = async (req, res, next) => {
  try {
    const { name, description, icon, active } = req.body;
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) throw new ApiError(404, "Specialty not found");

    if (name !== undefined) specialty.name = String(name).trim();
    if (description !== undefined) specialty.description = description;
    if (icon !== undefined) specialty.icon = icon;
    if (active !== undefined) specialty.active = active;

    await specialty.save();
    return res.json({ success: true, message: "Specialty updated successfully", data: specialty });
  } catch (err) {
    return next(err);
  }
};

/** DELETE /api/specialties/:id  (admin only) */
export const deleteSpecialty = async (req, res, next) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) throw new ApiError(404, "Specialty not found");

    const inUse = await Doctor.countDocuments({ specialty: specialty._id });
    if (inUse > 0) {
      // Preserve referential integrity: deactivate instead of deleting.
      specialty.active = false;
      await specialty.save();
      return res.json({
        success: true,
        message: `Specialty is assigned to ${inUse} doctor(s) and was deactivated instead of deleted`,
        data: specialty,
      });
    }

    await Specialty.findByIdAndDelete(specialty._id);
    return res.json({ success: true, message: "Specialty deleted successfully", data: null });
  } catch (err) {
    return next(err);
  }
};

export default { listSpecialties, createSpecialty, updateSpecialty, deleteSpecialty };