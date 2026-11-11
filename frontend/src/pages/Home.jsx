import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Hero from "../components/Hero.jsx";
import SpecialtyCard from "../components/SpecialtyCard.jsx";
import DoctorGrid from "../components/DoctorGrid.jsx";
import api, { getErrorMessage } from "../services/api.js";

export default function Home() {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [specRes, docRes] = await Promise.all([
          api.get("/specialties"),
          api.get("/doctors?limit=8"),
        ]);
        if (!active) return;
        setSpecialties(specRes.data.data);
        setDoctors(docRes.data.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="pb-10">
      <Hero />

      {/* Specialties */}
      <section className="container-x mt-16 text-center">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">Find by Speciality</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
          Browse through trusted doctors and schedule your appointment easily.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mx-auto h-20 w-20 animate-pulse rounded-full bg-slate-200 sm:h-24 sm:w-24" />
              ))
            : specialties.map((s) => <SpecialtyCard key={s._id} specialty={s} />)}
        </div>
      </section>

      {/* Top doctors */}
      <section className="container-x mt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Top Doctors to Book</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
            Simply browse through our extensive list of trusted doctors.
          </p>
        </div>

        <div className="mt-10">
          <DoctorGrid doctors={doctors} loading={loading} />
        </div>

        <div className="mt-10 text-center">
          <Link to="/doctors" className="btn-outline">View all doctors</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-white sm:px-12 sm:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                Book Appointment
                <br />
                With 100+ Trusted Doctors
              </h2>
              <Link to="/register" className="btn mt-7 bg-white text-primary hover:bg-white/90">
                Create account
              </Link>
            </div>
            <div className="hidden justify-center lg:flex">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=80"
                alt="Trusted doctor"
                className="h-[320px] w-auto rounded-2xl object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}