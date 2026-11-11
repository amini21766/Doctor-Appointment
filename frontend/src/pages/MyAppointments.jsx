import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCalendar, FiClock } from "react-icons/fi";
import api, { getErrorMessage, resolveImageUrl } from "../services/api.js";
import Loading from "../components/Loading.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Modal from "../components/Modal.jsx";
import { currency, formatDate, formatTimeLabel, appointmentPhase } from "../utils/format.js";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  const [busyId, setBusyId] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/appointments/my");
      setAppointments(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => appointments.filter((a) => {
    if (tab === "completed") return a.status === "completed";
    if (tab === "cancelled") return a.status === "cancelled";
    return a.status === "booked" && appointmentPhase(a.appointmentDate, a.appointmentTime) === "upcoming";
  }), [appointments, tab]);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusyId(id);
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success("Appointment cancelled");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const Card = ({ a }) => {
    const image = resolveImageUrl(a.doctor?.image);
    const statusColor = a.status === "completed" ? "bg-green-100 text-green-700"
      : a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";
    return (
      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-primary-light">
          {image ? <img src={image} alt={a.doctor?.name} className="h-full w-full object-cover object-top" />
            : <div className="flex h-full w-full items-center justify-center text-2xl text-primary/40">{a.doctor?.name?.charAt(0)}</div>}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-ink">{a.doctor?.name}</h3>
          <p className="text-sm text-slate-500">{a.doctor?.specialty?.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><FiCalendar /> {formatDate(a.appointmentDate)}</span>
            <span className="flex items-center gap-1"><FiClock /> {formatTimeLabel(a.appointmentTime)}</span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className={`badge ${statusColor}`}>{a.status}</span>
          <span className="text-sm font-medium text-ink">{currency(a.fee)}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDetail(a)} className="btn-outline py-1.5 text-xs">View details</button>
            {a.status === "booked" && (
              <button type="button" onClick={() => cancel(a._id)} disabled={busyId === a._id}
                className="btn-danger py-1.5 text-xs">
                {busyId === a._id ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-x py-12">
      <h1 className="text-2xl font-bold text-ink">My Appointments</h1>

      <div className="mt-6 flex gap-3 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-3 text-sm font-medium transition ${
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
          <EmptyState
            icon="📅"
            title={`No ${tab} appointments`}
            message={tab === "upcoming" ? "Book an appointment to get started." : `You have no ${tab} appointments.`}
            action={tab === "upcoming" ? <Link to="/doctors" className="btn-primary">Find a doctor</Link> : null}
          />
        ) : (
          filtered.map((a) => <Card key={a._id} a={a} />)
        )}
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Appointment details">
        {detail && (
          <div className="space-y-2 text-sm text-slate-600">
            <p><span className="font-medium text-ink">Doctor:</span> {detail.doctor?.name}</p>
            <p><span className="font-medium text-ink">Specialty:</span> {detail.doctor?.specialty?.name}</p>
            <p><span className="font-medium text-ink">Date:</span> {formatDate(detail.appointmentDate)}</p>
            <p><span className="font-medium text-ink">Time:</span> {formatTimeLabel(detail.appointmentTime)}</p>
            <p><span className="font-medium text-ink">Fee:</span> {currency(detail.fee)}</p>
            <p><span className="font-medium text-ink">Status:</span> {detail.status}</p>
            <p><span className="font-medium text-ink">Payment:</span> {detail.paymentStatus}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}