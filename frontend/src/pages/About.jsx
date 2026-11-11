import { Link } from "react-router-dom";
import { FiCalendar, FiSearch, FiUserCheck, FiShield } from "react-icons/fi";

const steps = [
  { icon: FiSearch, title: "Find a doctor", text: "Search by name or browse specialties to find the right specialist." },
  { icon: FiCalendar, title: "Pick a slot", text: "Choose an available date and time that fits your schedule." },
  { icon: FiUserCheck, title: "Confirm", text: "Book instantly and receive confirmation — no phone calls needed." },
];

const reasons = [
  "Verified, experienced specialists across six major fields.",
  "Real-time availability so you never double-book.",
  "Secure authentication and role-based access.",
  "Manage, reschedule and cancel appointments online.",
];

export default function About() {
  return (
    <div className="container-x py-14">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-ink">About Prescripto</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          Prescripto is a modern appointment booking platform that connects
          patients with trusted doctors. We make healthcare more accessible by
          removing the friction of phone calls and waiting rooms — book a
          consultation in a few clicks.
        </p>
      </section>

      <section className="mt-16 grid gap-8 md:grid-cols-2">
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-ink">Our mission</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            To give every patient fast, transparent access to quality medical
            care by making appointment booking simple, reliable and available
            around the clock.
          </p>
        </div>
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-ink">Our vision</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            A healthcare experience where scheduling never stands between people
            and the care they need — powered by dependable, transparent
            technology.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold text-ink">Why choose us</h2>
        <ul className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              <FiShield className="mt-0.5 shrink-0 text-primary" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold text-ink">How booking works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-2xl text-primary">
                <s.icon />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{i + 1}. {s.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 text-center">
        <Link to="/doctors" className="btn-primary">Find a doctor</Link>
      </div>
    </div>
  );
}