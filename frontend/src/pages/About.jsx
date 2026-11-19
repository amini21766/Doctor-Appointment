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

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-dark">
      {children}
    </p>
  );
}

export default function About() {
  return (
    <div className="pb-6">
      {/* ------------------------------- Hero --------------------------------- */}
      <section
        aria-labelledby="about-heading"
        className="relative overflow-hidden bg-gradient-to-b from-primary-light/70 via-primary-light/30 to-white"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container-x relative grid items-center gap-12 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-dark">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
              About Prescripto
            </span>

            <h1
              id="about-heading"
              className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl"
            >
              Healthcare, minus the runaround.
            </h1>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
              Prescripto connects you with verified specialists and real open slots — so
              booking care takes minutes, not phone calls.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/doctors" className="btn-primary">
                Find a doctor
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="btn border border-slate-300 bg-white/70 text-slate-700 hover:border-primary hover:text-primary"
              >
                How it works
              </a>
            </div>

            <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-500">
              <FiCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" />
              Free to browse — sign in only when you book.
            </p>
          </div>

          {/* Image composition */}
          <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rotate-0 rounded-[2.5rem] bg-white/40 ring-1 ring-primary/10 sm:-inset-3 sm:rotate-[-4deg]"
            />
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80"
              alt="Smiling doctor in a white coat"
              className="relative h-[360px] w-full rounded-[2rem] object-cover shadow-xl sm:h-[420px] lg:h-[460px]"
              decoding="async"
            />

            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 backdrop-blur sm:right-5 sm:top-5">
              <FiClock aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              24/7 booking
            </span>

            <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-lg ring-1 ring-slate-900/5 backdrop-blur sm:bottom-5 sm:left-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                <FiShield aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Verified specialists</p>
                <p className="text-[11px] text-slate-500">Credential-checked doctors</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- Stats -------------------------------- */}
      <section aria-label="Prescripto at a glance" className="container-x relative z-10 -mt-10">
        <ul className="grid grid-cols-2 gap-x-2 gap-y-6 rounded-2xl border border-slate-200/80 bg-white/95 px-2 py-6 shadow-xl shadow-primary/5 backdrop-blur sm:grid-cols-4 sm:divide-x sm:divide-slate-100 sm:py-7">
          {stats.map((stat) => (
            <li key={stat.label} className="px-3 text-center sm:px-4">
              <p className="text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------ Purpose ------------------------------- */}
      <section aria-labelledby="purpose-heading" className="container-x mt-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>Our purpose</Eyebrow>
            <h2
              id="purpose-heading"
              className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl"
            >
              Great care shouldn&apos;t depend on who you can reach by phone.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              We built Prescripto to take the friction out of the first step — finding the
              right doctor and getting on their calendar.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {purpose.map((item) => (
                <div key={item.label} className="flex gap-5 py-6 sm:gap-6">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <item.icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{item.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- Values ------------------------------- */}
      <section aria-labelledby="values-heading" className="container-x mt-20">
        <div className="max-w-2xl">
          <Eyebrow>What you can count on</Eyebrow>
          <h2
            id="values-heading"
            className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl"
          >
            Built around the patient, not the paperwork.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Four promises shape every screen, every search, and every booking.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => {
            const isFeatured = index === 0;
            const isTinted = index === values.length - 1;
            const isWide = isFeatured || isTinted;

            return (
              <article
                key={value.title}
                className={`relative overflow-hidden rounded-2xl p-6 sm:p-7 ${isWide ? "lg:col-span-2" : ""} ${
                  isFeatured
                    ? "bg-primary-dark text-white"
                    : isTinted
                      ? "border border-primary/10 bg-primary-light/60"
                      : "border border-slate-200 bg-white"
                }`}
              >
                {isFeatured && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/15"
                  />
                )}

                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isFeatured
                      ? "bg-white/15 text-white"
                      : isTinted
                        ? "bg-white text-primary shadow-sm ring-1 ring-primary/10"
                        : "bg-primary-light text-primary"
                  }`}
                >
                  <value.icon aria-hidden="true" className="h-5 w-5" />
                </span>

                <h3
                  className={`mt-5 text-base font-semibold ${
                    isFeatured ? "text-white" : "text-ink"
                  }`}
                >
                  {value.title}
                </h3>
                <p
                  className={`mt-2 max-w-md text-sm leading-relaxed ${
                    isFeatured ? "text-white/90" : "text-slate-600"
                  }`}
                >
                  {value.text}
                </p>

                {isFeatured && (
                  <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-white/90">
                    <FiCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Every profile reviewed before it goes live
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------------------------- How it works ---------------------------- */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="container-x mt-20 scroll-mt-24"
      >
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2
            id="how-heading"
            className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl"
          >
            Booked in three steps.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            From search to confirmed appointment, without a single phone call.
          </p>
        </div>

        <div className="relative mt-12">
          <div
            aria-hidden="true"
            className="absolute left-[16.7%] right-[16.7%] top-7 hidden h-px bg-gradient-to-r from-primary/0 via-primary/25 to-primary/0 md:block"
          />

          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 md:block md:text-center">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-white text-primary shadow-sm md:mx-auto">
                  <step.icon aria-hidden="true" className="h-6 w-6" />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-white"
                  >
                    {index + 1}
                  </span>
                </span>
                <div className="pt-1 md:mt-5 md:pt-0">
                  <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600 md:mx-auto">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------- CTA ---------------------------------- */}
      <section aria-labelledby="about-cta-heading" className="container-x mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary-dark px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5" />
            <span className="absolute right-10 top-8 hidden text-6xl font-light leading-none text-white/10 sm:block">
              +
            </span>
          </div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
                Ready when you are
              </p>
              <h2
                id="about-cta-heading"
                className="mt-3 max-w-xl text-2xl font-bold leading-tight sm:text-3xl"
              >
                Your next appointment is a few clicks away.
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/doctors" className="btn bg-white text-primary-dark hover:bg-white/90">
                Find a doctor
                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
