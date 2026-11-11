import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../services/api.js";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, form);
      toast.success(data.message);
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8" noValidate>
        <h1 className="text-xl font-semibold text-ink">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a new password for your account.</p>

        <div className="mt-6">
          <label className="label" htmlFor="password">New password</label>
          <input id="password" type="password" className="input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" className="input" value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} autoComplete="new-password" />
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
        </p>
      </form>
    </div>
  );
}