import { useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import CountrySelect from "../components/CountrySelect.jsx";
import { DEFAULT_COUNTRY } from "../utils/countries.js";
import api, { getErrorMessage } from "../services/api.js";

/* -------------------------------------------------------------------------- */
/* Brand tokens & contact details — edit these in one place.                  */
/* Accent: the project's primary indigo (#5f6FFF) via `primary` tokens.       */
/* -------------------------------------------------------------------------- */
const CONTACT_DETAILS = [
  {
    key: "email",
    label: "Email:",
    value: "care@yourclinic.com",
    href: "mailto:care@yourclinic.com",
    Icon: FiMail,
  },
  {
    key: "phone",
    label: "Phone:",
    value: "+1 (800) 123-4567",
    href: "tel:+18001234567",
    Icon: FiPhone,
  },
  {
    key: "location",
    label: "Location:",
    value: "450 Wellness Way, Suite 200, Boston, MA",
    href: null,
    Icon: FiMapPin,
  },
];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

const FIELD_ORDER = ["firstName", "lastName", "email", "phone", "message"];

const validators = {
  firstName: (value) => (value.trim() ? "" : "First name is required."),
  lastName: (value) => (value.trim() ? "" : "Last name is required."),
  email: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Email address is required.";
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return "Enter a valid email address.";
    return "";
  },
  phone: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Phone number is required.";
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return "Enter a valid phone number.";
    return "";
  },
  message: (value) => (value.trim() ? "" : "Please enter a message."),
};

const inputBase =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition " +
  "placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const inputClass = (hasError) =>
  `${inputBase} ${
    hasError ? "border-red-300 focus:border-red-500 focus:ring-red-500/15" : "border-slate-200"
  }`;

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
      <FiAlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        <span className="ml-0.5 text-primary" aria-hidden="true">
          *
        </span>
      </label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [formError, setFormError] = useState("");
  const [sentTo, setSentTo] = useState({ name: "", email: "" });

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const messageRef = useRef(null);

  const fieldRefs = {
    firstName: firstNameRef,
    lastName: lastNameRef,
    email: emailRef,
    phone: phoneRef,
    message: messageRef,
  };

  const isSending = status === "sending";

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
    // A new edit dismisses the previous confirmation.
    if (status === "sent") setStatus("idle");
    // Only re-validate live once the field has been touched or already flagged.
    if (touched[field] || errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validators[field](value) }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validators[field](form[field]) }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const nextErrors = {};
    FIELD_ORDER.forEach((field) => {
      nextErrors[field] = validators[field](form[field]);
    });
    setErrors(nextErrors);
    setTouched(Object.fromEntries(FIELD_ORDER.map((field) => [field, true])));

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    setStatus("sending");

    try {
      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();
      const email = form.email.trim();

      await api.post("/contact", {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email,
        phone: `${country.dial} ${form.phone.trim()}`,
        message: form.message.trim(),
      });

      setSentTo({ name: firstName, email });
      setStatus("sent");
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched({});
    } catch (err) {
      setFormError(getErrorMessage(err));
      setStatus("idle");
    }
  };

  return (
    <div className="pb-10">
      <section aria-labelledby="contact-heading" className="container-x pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-white sm:px-12 sm:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary-dark/30 blur-3xl" />
          </div>

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <FiMail aria-hidden="true" className="h-3.5 w-3.5" />
              Contact
            </span>

            <h1
              id="contact-heading"
              className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
            >
              How can we help you today?
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              Our dedicated patient support team is just a message or call away.
            </p>
          </div>
        </div>
      </section>

      <div className="container-x mt-10">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* ------------------------------ Left: info ------------------------------ */}
          <section aria-labelledby="contact-info-heading" className="card p-6 sm:p-7">
            <h2 id="contact-info-heading" className="text-lg font-semibold text-ink">
              Contact information
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Reach our patient support team directly.
            </p>

            <div className="mt-6 space-y-5">
              {CONTACT_DETAILS.map(({ key, label, value, href, Icon }) => (
                <div key={key} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs text-slate-500">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        className="mt-0.5 block break-words rounded py-0.5 text-sm font-semibold text-slate-900 underline-offset-4 transition hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-primary/10 bg-primary-light/60 p-4">
              <p className="text-sm font-semibold text-ink">Typical response time</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Within one business day.</p>
            </div>
          </section>

          {/* ------------------------------ Right: form ----------------------------- */}
          <section aria-labelledby="contact-form-heading" className="card p-6 sm:p-8">
            <h2 id="contact-form-heading" className="text-lg font-semibold text-ink">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fields marked <span className="text-primary">*</span> are required.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-6">
              {status === "sent" && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary-light px-3.5 py-3"
                >
                  <FiCheckCircle className="mt-px h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="min-w-0 break-words text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold">
                      {sentTo.name ? `Thanks, ${sentTo.name}!` : "Thanks!"}
                    </span>{" "}
                    Your message has been received — we&apos;ll reply to{" "}
                    <span className="font-medium">{sentTo.email}</span> shortly.
                  </p>
                </div>
              )}
              {formError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs leading-relaxed text-red-700"
                >
                  <FiAlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="space-y-5">
                {/* Row 1 — first + last name */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="contact-first-name" label="First name" error={errors.firstName}>
                    <input
                      id="contact-first-name"
                      ref={firstNameRef}
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Jane"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(errors.firstName)}
                      aria-describedby={errors.firstName ? "contact-first-name-error" : undefined}
                      className={inputClass(Boolean(errors.firstName))}
                      value={form.firstName}
                      onChange={handleChange("firstName")}
                      onBlur={handleBlur("firstName")}
                      disabled={isSending}
                    />
                  </Field>

                  <Field id="contact-last-name" label="Last name" error={errors.lastName}>
                    <input
                      id="contact-last-name"
                      ref={lastNameRef}
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Doe"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(errors.lastName)}
                      aria-describedby={errors.lastName ? "contact-last-name-error" : undefined}
                      className={inputClass(Boolean(errors.lastName))}
                      value={form.lastName}
                      onChange={handleChange("lastName")}
                      onBlur={handleBlur("lastName")}
                      disabled={isSending}
                    />
                  </Field>
                </div>

                {/* Row 2 — email */}
                <Field id="contact-email" label="Email" error={errors.email}>
                  <input
                    id="contact-email"
                    ref={emailRef}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter email"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                    className={inputClass(Boolean(errors.email))}
                    value={form.email}
                    onChange={handleChange("email")}
                    onBlur={handleBlur("email")}
                    disabled={isSending}
                  />
                </Field>

                {/* Row 3 — phone with integrated dial-code selector */}
                <Field id="contact-phone" label="Phone number" error={errors.phone}>
                  <div
                    className={`flex items-center rounded-lg border bg-white transition focus-within:ring-2 ${
                      errors.phone
                        ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500/15"
                        : "border-slate-200 focus-within:border-primary focus-within:ring-primary/20"
                    }`}
                  >
                    <CountrySelect value={country} onChange={setCountry} disabled={isSending} />

                    <span aria-hidden="true" className="h-5 w-px bg-slate-200" />

                    <input
                      id="contact-phone"
                      ref={phoneRef}
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="Phone number"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                      className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
                      value={form.phone}
                      onChange={handleChange("phone")}
                      onBlur={handleBlur("phone")}
                      disabled={isSending}
                    />
                  </div>
                </Field>

                {/* Row 4 — message */}
                <Field id="contact-message" label="Message" error={errors.message}>
                  <textarea
                    id="contact-message"
                    ref={messageRef}
                    name="message"
                    rows={4}
                    placeholder="Enter a medical inquiry, appointment request, or question..."
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    className={`${inputClass(Boolean(errors.message))} resize-y`}
                    value={form.message}
                    onChange={handleChange("message")}
                    onBlur={handleBlur("message")}
                    disabled={isSending}
                  />
                </Field>
              </div>
              <button
                type="submit"
                disabled={isSending}
                aria-busy={isSending}
                className="btn-primary mt-6"
              >
                {isSending ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Sending…
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
