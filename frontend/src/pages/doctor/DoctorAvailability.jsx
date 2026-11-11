import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Loading from "../../components/Loading.jsx";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const emptyDay = { enabled: false, startTime: "10:00", endTime: "17:00" };

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.doctorId) {
          const { data } = await api.get(`/doctors/${user.doctorId}`);
          setDoctor(data.data);
          setAvailable(data.data.available);
          const wa = data.data.weeklyAvailability || {};
          const normalized = {};
          DAYS.forEach((d) => { normalized[d] = { ...emptyDay, ...(wa[d] || {}) }; });
          setAvailability(normalized);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const updateDay = (day, patch) => {
    setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const save = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      await api.put(`/doctors/${doctor._id}/availability`, {
        weeklyAvailability: availability,
        available,
      });
      toast.success("Availability updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading availability..." />;
  if (!doctor || !availability) return <div className="container-x py-20 text-center text-slate-500">Doctor profile not found.</div>;

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-bold text-ink">Manage Availability</h1>
      <p className="mt-1 text-sm text-slate-500">
        Set the weekly schedule patients can book. Slots are generated every 30 minutes.
      </p>

      <label className="mt-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary"
          checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        Currently accepting appointments
      </label>

      <div className="mt-6 space-y-3">
        {DAYS.map((day) => {
          const cfg = availability[day];
          return (
            <div key={day} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex w-40 items-center gap-2 text-sm font-medium text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary"
                  checked={cfg.enabled}
                  onChange={(e) => updateDay(day, { enabled: e.target.checked })} />
                {day}
              </label>

              <div className="flex items-center gap-2">
                <input type="time" className="input w-32" value={cfg.startTime}
                  disabled={!cfg.enabled}
                  onChange={(e) => updateDay(day, { startTime: e.target.value })} />
                <span className="text-slate-400">to</span>
                <input type="time" className="input w-32" value={cfg.endTime}
                  disabled={!cfg.enabled}
                  onChange={(e) => updateDay(day, { endTime: e.target.value })} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <button type="button" onClick={save} className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save availability"}
        </button>
      </div>
    </div>
  );
}