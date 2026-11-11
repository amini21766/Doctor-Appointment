import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";
import { roleHome } from "../utils/roles.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) next.phone = "Enter a valid phone number";
    if (form.password.length < 6) next.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success("Account created successfully");
      navigate(roleHome(user.role));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-8" noValidate>
        <h1 className="text-xl font-semibold text-ink">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Book appointments with trusted doctors.</p>

        <div className="mt-6">
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email" aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" className="input" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password" aria-invalid={Boolean(errors.password)} />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" className="input" value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}