import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Specialty from "../models/Specialty.js";
import Appointment from "../models/Appointment.js";

const SPECIALTIES = [
  { name: "General physician", icon: "FaStethoscope", description: "Primary care and general health consultations." },
  { name: "Gynecologist", icon: "FaVenus", description: "Women's health, pregnancy and reproductive care." },
  { name: "Dermatologist", icon: "FaAllergies", description: "Skin, hair and nail conditions." },
  { name: "Pediatricians", icon: "FaBaby", description: "Healthcare for infants, children and adolescents." },
  { name: "Neurologist", icon: "FaBrain", description: "Disorders of the brain and nervous system." },
  { name: "Gastroenterologist", icon: "FaHeartbeat", description: "Digestive system and gastrointestinal care." },
];

const DOCTORS = [
  { name: "Dr. Richard James", specialty: "General physician", degree: "MBBS, MD", experience: "4 Years", fees: 50 },
  { name: "Dr. Emily Larson", specialty: "Gynecologist", degree: "MBBS, MS", experience: "6 Years", fees: 60 },
  { name: "Dr. Sarah Patel", specialty: "Dermatologist", degree: "MBBS, MD", experience: "5 Years", fees: 55 },
  { name: "Dr. Christopher Lee", specialty: "Pediatricians", degree: "MBBS, DCH", experience: "8 Years", fees: 45 },
  { name: "Dr. Jennifer Garcia", specialty: "Neurologist", degree: "MBBS, DM", experience: "10 Years", fees: 80 },
  { name: "Dr. Andrew Williams", specialty: "Gastroenterologist", degree: "MBBS, DM", experience: "7 Years", fees: 70 },
  { name: "Dr. Christopher Davis", specialty: "General physician", degree: "MBBS", experience: "3 Years", fees: 40 },
  { name: "Dr. Timothy White", specialty: "Gynecologist", degree: "MBBS, MS", experience: "9 Years", fees: 65 },
  { name: "Dr. Ava Mitchell", specialty: "Dermatologist", degree: "MBBS, MD", experience: "4 Years", fees: 50 },
  { name: "Dr. Jeffrey King", specialty: "Pediatricians", degree: "MBBS, DCH", experience: "6 Years", fees: 48 },
  { name: "Dr. Zoe Kelly", specialty: "Neurologist", degree: "MBBS, DM", experience: "11 Years", fees: 85 },
  { name: "Dr. Patrick Harris", specialty: "Gastroenterologist", degree: "MBBS, MD", experience: "5 Years", fees: 60 },
  { name: "Dr. Chloe Evans", specialty: "General physician", degree: "MBBS", experience: "2 Years", fees: 38 },
  { name: "Dr. Ryan Martinez", specialty: "Gynecologist", degree: "MBBS, MS", experience: "8 Years", fees: 62 },
  { name: "Dr. Amelia Hill", specialty: "Dermatologist", degree: "MBBS, MD", experience: "7 Years", fees: 58 },
];

const PATIENTS = [
  { name: "John Carter", email: "john.carter@example.com" },
  { name: "Mary Johnson", email: "mary.johnson@example.com" },
  { name: "David Smith", email: "david.smith@example.com" },
];

const defaultAvailability = () => {
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

const slug = (email) => email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=256`;

const run = async () => {
  try {
    await connectDB();
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Specialty.deleteMany({}),
      Appointment.deleteMany({}),
    ]);

    // Admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThis123!";
    const adminName = process.env.ADMIN_NAME || "Super Admin";
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      phone: "+1 000 000 0000",
      profileImage: avatar(adminName),
    });
    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);

    // Specialties
    const specialties = await Specialty.insertMany(SPECIALTIES);
    const specMap = Object.fromEntries(specialties.map((s) => [s.name, s._id]));
    console.log(`Specialties: ${specialties.length}`);

    // Patients
    const patients = await Promise.all(
      PATIENTS.map((p) =>
        User.create({
          ...p,
          password: "Password123!",
          role: "patient",
          phone: "+1 555 010 0000",
          profileImage: avatar(p.name),
        })
      )
    );
    console.log(`Patients: ${patients.length}`);

    // Doctors
    const createdDoctors = [];
    for (const d of DOCTORS) {
      const email = `${slug(d.name)}@doctor.example.com`;
      const user = await User.create({
        name: d.name,
        email,
        password: "Doctor123!",
        role: "doctor",
        phone: "+1 555 020 0000",
        profileImage: avatar(d.name),
      });
      const doctor = await Doctor.create({
        user: user._id,
        name: d.name,
        email,
        image: avatar(d.name),
        specialty: specMap[d.specialty],
        degree: d.degree,
        experience: d.experience,
        about: `${d.name} is a dedicated ${d.specialty.toLowerCase()} with ${d.experience} of clinical experience. They are committed to delivering compassionate, evidence-based care and helping patients achieve their best possible health outcomes.`,
        fees: d.fees,
        address: "123 Health Street, Medical City",
        available: true,
        isActive: true,
        weeklyAvailability: defaultAvailability(),
      });
      createdDoctors.push(doctor);
    }
    console.log(`Doctors: ${createdDoctors.length}`);

    // A couple of sample appointments
    const firstDoctor = createdDoctors[0];
    const sampleDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await Appointment.create({
      patient: patients[0]._id,
      doctor: firstDoctor._id,
      appointmentDate: sampleDate,
      appointmentTime: "10:00",
      fee: firstDoctor.fees,
      status: "booked",
    });
    console.log("Sample appointment created");

    console.log("\nSeed complete.");
    console.log("-------------------------------");
    console.log(`Admin login:   ${adminEmail} / ${adminPassword}`);
    console.log("Patient login: john.carter@example.com / Password123!");
    console.log(`Doctor login:  ${slug(DOCTORS[0].name)}@doctor.example.com / Doctor123!`);
    console.log("-------------------------------");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

run();