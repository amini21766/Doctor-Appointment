import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTarget,
} from "react-icons/fi";
import { resolveImageUrl } from "../services/api.js";

const stats = [
  { value: "6", label: "Specialties" },
  { value: "100+", label: "Verified doctors" },
  { value: "24/7", label: "Online booking" },
  { value: "0", label: "Calls required" },
];

const purpose = [
  {
    icon: FiTarget,
    label: "Mission",
    text: "Make quality care easier to reach — simple to find, simple to book, and available at any hour.",
  },
  {
    icon: FiEye,
    label: "Vision",
    text: "A healthcare experience where scheduling fades into the background and care takes the front seat.",
  },
];

const values = [
  {
    icon: FiShield,
    title: "Verified specialists",
    text: "Every doctor is credential-checked and actively practicing in one of six core specialties.",
  },
  {
    icon: FiClock,
    title: "Real-time availability",
    text: "Open slots update as they change — no double-booking, no waiting on hold.",
  },
  {
    icon: FiLock,
    title: "Private by design",
    text: "Secure sign-in and role-based access keep your health details yours.",
  },
  {
    icon: FiRefreshCw,
    title: "In your control",
    text: "Reschedule or cancel from your dashboard — no calls, no queues, no awkward conversations.",
  },
];

const steps = [
  {
    icon: FiSearch,
    title: "Find your doctor",
    text: "Search by name or specialty, and compare verified profiles.",
  },
  {
    icon: FiCalendar,
    title: "Pick a time",
    text: "Choose a real open slot that fits your day — no back-and-forth.",
  },
  {
    icon: FiCheckCircle,
    title: "You're booked",
    text: "Confirm in one click. Your appointment appears in your dashboard.",
  },
];

function SectionHeading({ id, title, description }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <h2 id={id} className="text-2xl font-bold text-ink sm:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

const heroImage = resolveImageUrl("/doctor-images/dr-emily-larson.jpg");
const ctaImage = resolveImageUrl("/doctor-images/dr-richard-james.jpg");

export default function About() {
  return (
    <div className="pb-10">
      {/* ------------------------------- Hero --------------------------------- */}
      <section aria-labelledby="about-heading" className="container-x pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-white sm:px-12 sm:py-16 lg:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary-dark/30 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white" />
                About Prescripto
              </span>

              <h1
                id="about-heading"
                className="mt-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-4xl xl:text-5xl"
              >
                Healthcare, minus the runaround.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                Prescripto connects you with verified specialists and real open slots — so
                booking care takes minutes, not phone calls.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link to="/doctors" className="btn bg-white text-primary hover:bg-white/90">
                  Find a doctor
                  <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="btn border border-white/40 text-white hover:bg-white/10"
                >
                  How it works
                </a>
              </div>

              <p className="mt-5 flex items-center gap-1.5 text-xs text-white/75">
                <FiCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Free to browse — sign in only when you book.
              </p>
            </div>

            <div className="relative hidden justify-center lg:flex">
              <img
                src={heroImage}
                alt="Smiling doctor in a white coat"
                className="h-[360px] w-auto rounded-2xl object-cover shadow-lg"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- Stats -------------------------------- */}
      <section aria-label="Prescripto at a glance" className="container-x mt-10">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label} className="card px-4 py-5 text-center">
              <p className="text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------ Purpose ------------------------------- */}
      <section aria-labelledby="purpose-heading" className="container-x mt-20">
        <SectionHeading
          id="purpose-heading"
          title="Our purpose"
          description="Great care shouldn't depend on who you can reach by phone. We built Prescripto to take the friction out of the first step."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {purpose.map((item) => (
            <article key={item.label} className="card p-6 sm:p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-ink">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
            </article>
          ))}
        </div>
      </section>


      {/* ------------------------------- Values ------------------------------- */}
      <section aria-labelledby="values-heading" className="container-x mt-20">
        <SectionHeading
          id="values-heading"
          title="What you can count on"
          description="Four promises shape every screen, every search, and every booking."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <article key={value.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
                <value.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-ink">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------- How it works ---------------------------- */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="container-x mt-20 scroll-mt-24"
      >
        <SectionHeading
          id="how-heading"
          title="Booked in three steps"
          description="From search to confirmed appointment, without a single phone call."
        />

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="card p-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
                <step.icon aria-hidden="true" className="h-6 w-6" />
              </span>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------- CTA ---------------------------------- */}
      <section aria-labelledby="about-cta-heading" className="container-x mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-white sm:px-12 sm:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary-dark/30 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2
                id="about-cta-heading"
                className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl"
              >
                Ready to book your next appointment?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                Find a verified specialist and choose a real open slot in minutes.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/doctors" className="btn bg-white text-primary hover:bg-white/90">
                  Find a doctor
                  <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="btn border border-white/40 text-white hover:bg-white/10"
                >
                  Contact us
                </Link>
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <img
                src={ctaImage}
                alt="Doctor ready to help"
                className="h-[320px] w-auto rounded-2xl object-cover shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
