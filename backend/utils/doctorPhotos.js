/**
 * Bundled portraits for the demo doctors.
 *
 * The files live in backend/public/doctor-images (tracked in git) and are
 * served by Express, so the app does not depend on an external avatar service.
 */
const DOCTOR_PHOTOS = [
  ["Dr. Richard James", "dr-richard-james.jpg"],
  ["Dr. Emily Larson", "dr-emily-larson.jpg"],
  ["Dr. Sarah Patel", "dr-sarah-patel.jpg"],
  ["Dr. Christopher Lee", "dr-christopher-lee.jpg"],
  ["Dr. Jennifer Garcia", "dr-jennifer-garcia.jpg"],
  ["Dr. Andrew Williams", "dr-andrew-williams.jpg"],
  ["Dr. Christopher Davis", "dr-christopher-davis.jpg"],
  ["Dr. Timothy White", "dr-timothy-white.jpg"],
  ["Dr. Ava Mitchell", "dr-ava-mitchell.jpg"],
  ["Dr. Jeffrey King", "dr-jeffrey-king.jpg"],
  ["Dr. Zoe Kelly", "dr-zoe-kelly.jpg"],
  ["Dr. Patrick Harris", "dr-patrick-harris.jpg"],
  ["Dr. Chloe Evans", "dr-chloe-evans.jpg"],
  ["Dr. Ryan Martinez", "dr-ryan-martinez.jpg"],
  ["Dr. Amelia Hill", "dr-amelia-hill.jpg"],
  ["doctor", "doctor-example.jpg"],
];

const normalizeName = (name) => String(name || "").trim().replace(/\s+/g, " ").toLowerCase();

const PHOTO_BY_NAME = new Map(
  DOCTOR_PHOTOS.map(([name, file]) => [normalizeName(name), `/doctor-images/${file}`])
);

/** Return the bundled portrait path for a doctor name, or "" when none exists. */
export const getDoctorPhoto = (name) => PHOTO_BY_NAME.get(normalizeName(name)) || "";

export default { getDoctorPhoto };
