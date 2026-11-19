import "dotenv/config";
import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import { getDoctorPhoto } from "../utils/doctorPhotos.js";

/**
 * Assign the bundled portrait to existing demo doctors.
 *
 * Safe to re-run: uploaded photos and Cloudinary URLs are preserved, while
 * empty images, generated ui-avatars and previous bundled portraits are
 * refreshed from backend/public/doctor-images.
 */
const shouldReplace = (image) =>
  !image || /ui-avatars\.com/i.test(image) || String(image).startsWith("/doctor-images/");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const doctors = await Doctor.find({}).select("_id name email image user");
    let updated = 0;
    const skipped = [];

    for (const doctor of doctors) {
      const photo = getDoctorPhoto(doctor.name);

      if (!photo) {
        skipped.push(`${doctor.name} (${doctor.email}) — no bundled photo`);
        continue;
      }
      if (!shouldReplace(doctor.image)) {
        skipped.push(`${doctor.name} (${doctor.email}) — keeping ${doctor.image}`);
        continue;
      }

      await Doctor.updateOne({ _id: doctor._id }, { $set: { image: photo } });
      if (doctor.user) {
        await User.updateOne({ _id: doctor.user }, { $set: { profileImage: photo } });
      }

      updated += 1;
      console.log(`Updated ${doctor.name}: ${photo}`);
    }

    console.log(`\nDoctor photos updated: ${updated}`);
    if (skipped.length) {
      console.log("Skipped:");
      skipped.forEach((entry) => console.log(`  - ${entry}`));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Doctor photo update failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
