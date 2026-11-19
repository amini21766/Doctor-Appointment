import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiAlertTriangle, FiCheckCircle, FiMail } from "react-icons/fi";
import Loading from "../components/Loading.jsx";
import api, { getErrorMessage } from "../services/api.js";

/**
 * Landing page for the unsubscribe link embedded in newsletter emails:
 * /unsubscribe?token=<subscriber token>
 */
export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState(token ? "loading" : "missing");
  const [message, setMessage] = useState(
    token ? "" : "This unsubscribe link is incomplete — the token is missing."
  );
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    const run = async () => {
      try {
        const { data } = await api.post("/subscriptions/unsubscribe", { token });
        setStatus("done");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err));
      }
    };

    run();
  }, [token]);

  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-10 sm:py-14">
      <div className="card w-full max-w-lg p-6 text-center sm:p-8">
        {status === "loading" ? (
          <Loading label="Updating your subscription..." />
        ) : (
          <>
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
                status === "done"
                  ? "bg-emerald-50 text-emerald-600"
                  : status === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-primary-light text-primary"
              }`}
            >
              {status === "done" ? (
                <FiCheckCircle />
              ) : status === "error" ? (
                <FiAlertTriangle />
              ) : (
                <FiMail />
              )}
            </span>

            <h1 className="mt-5 text-xl font-bold text-ink">
              {status === "done"
                ? "You've been unsubscribed"
                : status === "error"
                ? "Something went wrong"
                : "Unsubscribe link is invalid"}
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>

            <p className="mt-4 text-xs text-slate-400">
              You can re-subscribe from the newsletter section on our home page at any time.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/" className="btn-primary py-2">
                Back to home
              </Link>
              <Link to="/doctors" className="btn-outline py-2">
                Browse doctors
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
