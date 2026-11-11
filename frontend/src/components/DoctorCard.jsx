import { Link } from "react-router-dom";
import { resolveImageUrl } from "../services/api.js";
import { currency } from "../utils/format.js";

export default function DoctorCard({ doctor, showFee = false }) {
  const image = resolveImageUrl(doctor.image);

  return (
    <Link
      to={`/doctor/${doctor._id}`}
      className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-sm"
    >
      {/* Image area */}
      <div className="bg-primary-light">
        {image ? (
          <img
            src={image}
            alt={doctor.name}
            loading="lazy"
            className="h-56 w-full object-cover object-top transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center text-4xl text-primary/40">
            {doctor.name?.charAt(0) || "D"}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span
            className={`h-2 w-2 rounded-full ${
              doctor.available ? "bg-green-500" : "bg-slate-300"
            }`}
          />
          <span className={doctor.available ? "text-green-600" : "text-slate-400"}>
            {doctor.available ? "Available" : "Not available"}
          </span>
        </div>

        <h3 className="mt-2 truncate text-sm font-semibold text-ink sm:text-base">
          {doctor.name}
        </h3>
        <p className="truncate text-xs text-slate-500 sm:text-sm">
          {doctor.specialty?.name || doctor.specialty || "Specialist"}
        </p>

        {showFee && (
          <p className="mt-2 text-xs font-medium text-primary">
            Fee: {currency(doctor.fees)}
          </p>
        )}
      </div>
    </Link>
  );
}