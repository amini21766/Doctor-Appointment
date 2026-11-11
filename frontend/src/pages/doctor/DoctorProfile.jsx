import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiUpload } from "react-icons/fi";
import api, { getErrorMessage, resolveImageUrl } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Loading from "../../components/Loading.jsx";

export default function DoctorProfile() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const specRes = await api.get("/specialties");
        setSpecialties(specRes.data.data);
        if (user?.doctorId) {
          const { data } = await api.get(`/doctors/${user.doctorId}`);
          setDoctor(data.data);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    try {
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDoctor((d) => ({ ...d, image: data.data.url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: doctor.name,
        degree: doctor.degree,
        experience: doctor.experience,
        about: doctor.about,
        fees: Number(doctor.fees),
        address: doctor.address,
        image: doctor.image,
        specialty: typeof doctor.specialty === "object" ? doctor.specialty._id : doctor.specialty,
        available: doctor.available,
      };
      const { data } = await api.put(`/doctors/${doctor._id}`, payload);
      setDoctor(data.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading profile..." />;
  if (!doctor) return <div className="container-x py-20 text-center text-slate-500">Doctor profile not found.</div>;

  const image = resolveImageUrl(doctor.image);

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-bold text-ink">Doctor Profile</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="card flex flex-col items-center p-6 text-center">
          <div className="h-32 w-32 overflow-hidden rounded-full bg-primary-light">
            {image ? <img src={image} alt={doctor.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-4xl text-primary/40">{doctor.name?.charAt(0)}</div>}
          </div>
          <label className="btn-outline mt-5 cursor-pointer py-2">
            <FiUpload /> Change photo
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
          </label>
        </div>

        <form onSubmit={save} className="card grid gap-4 p-8 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={doctor.name}
              onChange={(e) => setDoctor({ ...doctor, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input bg-slate-50" value={doctor.email} disabled />
          </div>
          <div>
            <label className="label" htmlFor="specialty">Specialty</label>
            <select id="specialty" className="input"
              value={typeof doctor.specialty === "object" ? doctor.specialty._id : doctor.specialty}
              onChange={(e) => setDoctor({ ...doctor, specialty: e.target.value })}>
              {specialties.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="degree">Degree</label>
            <input id="degree" className="input" value={doctor.degree}
              onChange={(e) => setDoctor({ ...doctor, degree: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="experience">Experience</label>
            <input id="experience" className="input" value={doctor.experience}
              onChange={(e) => setDoctor({ ...doctor, experience: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="fees">Consultation fee</label>
            <input id="fees" type="number" min="0" className="input" value={doctor.fees}
              onChange={(e) => setDoctor({ ...doctor, fees: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">Address</label>
            <input id="address" className="input" value={doctor.address}
              onChange={(e) => setDoctor({ ...doctor, address: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="about">About</label>
            <textarea id="about" rows={4} className="input" value={doctor.about}
              onChange={(e) => setDoctor({ ...doctor, about: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary"
                checked={doctor.available}
                onChange={(e) => setDoctor({ ...doctor, available: e.target.checked })} />
              Accepting new appointments
            </label>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}