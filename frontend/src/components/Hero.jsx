import { Link } from "react-router-dom";
import { resolveImageUrl } from "../services/api.js";

const AVATAR_COLORS = ["#fca5a5", "#93c5fd", "#fcd34d"];

export default function Hero({ doctors = [] }) {
  const avatarDoctors = doctors.filter((doctor) => doctor.image).slice(0, 3);

  return (
    <section className="container-x pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-white sm:px-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-4xl xl:text-5xl">
              Book Appointment
              <br />
              With Trusted Doctors
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              Browse through our extensive list of trusted doctors, compare
              specialties and schedule your appointment easily — anytime,
              anywhere.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link to="/doctors" className="btn bg-white text-primary hover:bg-white/90">
                Book appointment
              </Link>
              <div className="flex items-center gap-2 text-sm text-white/85">
                <span className="flex -space-x-2">
                  {avatarDoctors.length > 0
                    ? avatarDoctors.map((doctor) => (
                        <img
                          key={doctor._id}
                          src={resolveImageUrl(doctor.image)}
                          alt=""
                          loading="lazy"
                          className="h-6 w-6 rounded-full border-2 border-primary bg-white/30 object-cover object-top"
                        />
                      ))
                    : AVATAR_COLORS.map((color) => (
                        <span
                          key={color}
                          className="h-6 w-6 rounded-full border-2 border-primary"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                </span>
                <span>100+ doctors available</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative hidden justify-center lg:flex">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=80"
              alt="Friendly medical professional"
              className="h-[360px] w-auto rounded-2xl object-cover shadow-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}