import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FiArrowRight, FiCheck, FiCheckCircle, FiMail } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/**
 * Newsletter signup — a compact, single-purpose band at the end of the home page.
 * Design intent: one short promise, one inline field, zero clutter.
 */
export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const inputRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (subscribedEmail) successRef.current?.focus();
  }, [subscribedEmail]);

  const handleChange = (event) => {
    setEmail(event.target.value);
    if (error) setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      inputRef.current?.focus();
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/subscriptions", { email: value, source: "home" });
      toast.success(data.message);
      setSubscribedEmail(data.data?.email || value);
      setEmail("");
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubscribedEmail("");
    setError("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <section
      id="subscribe"
      aria-labelledby="newsletter-heading"
      className="container-x mt-16 scroll-mt-24 sm:mt-20"
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-primary-light/70">
        {/* Ambient decoration only — hidden from assistive tech */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <FiMail className="absolute -bottom-12 right-6 h-48 w-48 rotate-[-12deg] text-primary/[0.06] sm:right-14 sm:h-56 sm:w-56" />
        </div>

        <div className="relative grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:py-12">
          {/* Promise */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary ring-1 ring-primary/10">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
              Newsletter
            </span>
            <h2
              id="newsletter-heading"
              className="mt-4 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-[1.75rem]"
            >
              Better health, once a month.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              Doctor-approved tips and checkup offers — nothing else.
            </p>
          </div>

          {/* Action */}
          <div>
            {subscribedEmail ? (
              <div
                ref={successRef}
                tabIndex={-1}
                role="status"
                aria-live="polite"
                className="flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-white/90 p-4 shadow-sm outline-none sm:flex-row sm:items-center"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <FiCheckCircle aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="min-w-0 flex-1 text-sm leading-snug">
                  <span className="block font-semibold text-ink">You&apos;re subscribed.</span>
                  <span className="block truncate text-xs text-slate-500" title={subscribedEmail}>
                    {subscribedEmail}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="self-start rounded-full px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:self-auto"
                >
                  Change email
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>

                <div
                  className={`flex flex-col gap-2 rounded-2xl border bg-white p-2 shadow-sm transition focus-within:ring-4 sm:flex-row sm:items-center sm:rounded-full ${
                    error
                      ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-500/10"
                      : "border-slate-200 focus-within:border-primary focus-within:ring-primary/15"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
                    <FiMail
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 ${error ? "text-red-400" : "text-slate-400"}`}
                    />
                    <input
                      ref={inputRef}
                      id="newsletter-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "newsletter-error" : "newsletter-privacy"}
                      className="w-full min-w-0 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                      value={email}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-full"
                  >
                    {loading ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        Subscribe
                        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 pl-1 text-xs leading-relaxed">
                  {error ? (
                    <p id="newsletter-error" role="alert" className="text-red-600">
                      {error}
                    </p>
                  ) : (
                    <p id="newsletter-privacy" className="flex items-center gap-1.5 text-slate-600">
                      <FiCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" />
                      No spam. Unsubscribe anytime.
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
