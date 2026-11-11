import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiUpload } from "react-icons/fi";
import api, { getErrorMessage, resolveImageUrl } from "../../services/api.js";

export default function AddDoctor() {
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", specialty: "",
    degree: "MBBS", experience: "1 Year", about: "", fees: 50, address: "",
  });

  useEffect(() => {
    api.get("/specialties")
      .then((res) => {
        setSpecialties(res.data.data);
        if (res.data.data[0]) setForm((f) => ({ ...f, specialty: res.data.data[0]._id }));
      })
      .catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    try {
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImage(data.data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await api.post("/doctors", { ...form, fees: Number(form.fees), image });
      toast.success("Doctor created successfully");
      navigate("/admin/doctors");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const img = resolveImageUrl(image);

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Add Doctor</h2>

      <form onSubmit={onSubmit} className="card mt-5 grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2 flex items-center gap-5">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-primary-light">
            {img ? <img src={img} alt="preview" className="h-full w-full object-cover" />
              : <span className="flex h-full w-full items-center justify-center text-xs text-primary">IMG</span>}
          </div>
          <label className="btn-outline cursor-pointer py-2">
            <FiUpload /> Upload image
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
          </label>
        </div>

        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="password">Temporary password</label>
          <input id="password" type="password" className="input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" className="input" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="specialty">Specialty</label>
          <select id="specialty" className="input" value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
            {specialties.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="degree">Degree</label>
          <input id="degree" className="input" value={form.degree}
            onChange={(e) => setForm({ ...form, degree: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="experience">Experience</label>
          <input id="experience" className="input" value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="fees">Consultation fee</label>
          <input id="fees" type="number" min="0" className="input" value={form.fees}
            onChange={(e) => setForm({ ...form, fees: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">Address</label>
          <input id="address" className="input" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="about">About</label>
          <textarea id="about" rows={4} className="input" value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create doctor"}
          </button>
        </div>
      </form>
    </div>
  );
}