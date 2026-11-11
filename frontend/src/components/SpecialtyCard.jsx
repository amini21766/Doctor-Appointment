import { Link } from "react-router-dom";
import {
  FaStethoscope,
  FaVenus,
  FaAllergies,
  FaBaby,
  FaBrain,
  FaHeartbeat,
} from "react-icons/fa";

/**
 * Explicit icon map. Importing named icons (instead of `import * as Fa`)
 * keeps the bundle small — the wildcard import pulled in every FA icon.
 */
const ICONS = {
  FaStethoscope,
  FaVenus,
  FaAllergies,
  FaBaby,
  FaBrain,
  FaHeartbeat,
};

export default function SpecialtyCard({ specialty }) {
  const Icon = (specialty?.icon && ICONS[specialty.icon]) || FaStethoscope;

  return (
    <Link
      to={`/doctors/${encodeURIComponent(specialty.name)}`}
      className="group flex flex-col items-center gap-3 text-center"
      aria-label={`View ${specialty.name} doctors`}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-3xl text-primary transition group-hover:-translate-y-1 group-hover:bg-primary group-hover:text-white sm:h-24 sm:w-24">
        <Icon />
      </span>
      <span className="text-xs font-medium text-ink sm:text-sm">
        {specialty.name}
      </span>
    </Link>
  );
}