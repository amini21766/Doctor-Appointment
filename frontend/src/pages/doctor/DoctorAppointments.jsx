import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiCalendar, FiClock, FiUser } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { currency, formatDate, formatTimeLabel, appointmentPhase } from "../../utils/format.js";

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/appointments/doctor");
      setAppointments(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => appointments.filter((a) => {
    if (tab === "today") return a.appointmentDate === today && a.status === "booked";
    if (tab === "completed") return a.status === "completed";
    if (tab === "cancelled") return a.status === "cancelled";
    return a.status === "booked" && appointmentPhase(a.appointmentDate, a.appointmentTime) === "upcoming";
  }), [appointments, tab, today]);

  const act = async (id, action) => {
    if (!window.confirm(`${action === "complete" ? "Mark as completed" : "Cancel"}?`)) return;
    setBusyId(id);
    try {
      await api.patch(`/appointments/${id}/${action}`);
      toast.success(action === "complete" ? "Appointment completed" : "Appointment cancelled");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-bold text-ink">Appointments</h1>

      <div className="mt-6 flex gap-3 overflow-x-auto border-b border-slate-200 no-scrollbar">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-primary"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <Loading label="Loading appointments..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title={`No ${tab} appointments`} />
        ) : (
          filtered.map((a) => (
            <div key={a._id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-lg text-primary">
                  <FiUser />
                </span>
                <div>
                  <p className="font-medium text-ink">{a.patient?.name}</p>
                  <p className="text-xs text-slate-500">{a.patient?.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><FiCalendar /> {formatDate(a.appointmentDate)}</span>
                    <span className="flex items-center gap-1"><FiClock /> {formatTimeLabel(a.appointmentTime)}</span>
                    <span>{currency(a.fee)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`badge ${
                  a.status === "completed" ? "bg-green-100 text-green-700"
                    : a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>{a.status}</span>
                {a.status === "booked" && (
                  <>
                    <button type="button" onClick={() => act(a._id, "complete")} disabled={busyId === a._id}
                      className="btn-primary py-1.5 text-xs">Complete</button>
                    <button type="button" onClick={() => act(a._id, "cancel")} disabled={busyId === a._id}
                      className="btn-danger py-1.5 text-xs">Cancel</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}