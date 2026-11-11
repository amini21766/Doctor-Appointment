import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../services/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);
    setDevResetUrl("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      toast.success(data.message);
      if (data.data?.devResetUrl) setDevResetUrl(data.data.devResetUrl);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8" noValidate>
        <h1 className="text-xl font-semibold text-ink">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <div className="mt-6">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>

        {devResetUrl && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            <p className="font-medium">Email not configured (dev mode).</p>
            <a href={devResetUrl} className="mt-1 block break-all text-primary hover:underline">
              {devResetUrl}
            </a>
          </div>
        )}

        <p className="mt-5 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
        </p>
      </form>
    </div>
  );
}