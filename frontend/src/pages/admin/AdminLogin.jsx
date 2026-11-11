import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { getErrorMessage } from "../../services/api.js";

export default function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      if (user.role !== "admin") {
        await logout();
        toast.error("This account does not have admin access");
        return;
      }
      toast.success("Welcome, admin");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8" noValidate>
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">+</span>
          <span className="text-lg font-semibold text-ink">Admin Panel</span>
        </div>

        <h1 className="text-xl font-semibold text-ink">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage the platform.</p>

        <div className="mt-6">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}