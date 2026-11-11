import { useState } from "react";
import { toast } from "react-toastify";
import { FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import api, { getErrorMessage } from "../services/api.js";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (!form.message.trim()) next.message = "Message is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/contact", form);
      toast.success(data.message);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (id, label, type = "text") => (
    <div className="mt-4">
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        className="input"
        value={form[id]}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        aria-invalid={Boolean(errors[id])}
      />
      {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="container-x py-14">
      <h1 className="text-3xl font-bold text-ink">Contact us</h1>
      <p className="mt-3 text-sm text-slate-500">We&apos;re here to help. Reach out any time.</p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="space-y-5">
          {[
            { icon: FiPhone, label: "Phone", value: "+1 (555) 010-2030" },
            { icon: FiMail, label: "Email", value: "support@prescripto.test" },
            { icon: FiMapPin, label: "Address", value: "123 Health Street, Medical City" },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-lg text-primary">
                <c.icon />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{c.label}</p>
                <p className="text-sm text-slate-500">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="card p-8" noValidate>
          {field("name", "Your name")}
          {field("email", "Email", "email")}
          {field("phone", "Phone")}
          <div className="mt-4">
            <label className="label" htmlFor="message">Message</label>
            <textarea
              id="message"
              rows={4}
              className="input"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              aria-invalid={Boolean(errors.message)}
            />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
          </div>

          <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? "Sending..." : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}