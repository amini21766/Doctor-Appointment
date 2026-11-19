import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiSearch } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { currency, formatDate, formatTimeLabel } from "../../utils/format.js";

const STATUSES = ["", "booked", "completed", "cancelled"];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/appointments", {
        params: { search: search || undefined, status: status || undefined },
      });
      setAppointments(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const act = async (id, action) => {
    if (!window.confirm(`${action === "cancel" ? "Cancel" : "Complete"} this appointment?`)) return;
    setBusyId(id);
    try {
      await api.patch(`/appointments/${id}/${action}`);
      toast.success(`Appointment ${action === "cancel" ? "cancelled" : "completed"}`);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Appointments</h2>

      <div className="mt-5 grid gap-3 sm:max-w-xl sm:grid-cols-2">
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search appointments"
            value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search appointments" />
        </div>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All statuses"}</option>
          ))}
        </select>
      </div>

      <div className="card mt-5 overflow-x-auto">
        {loading ? (
          <Loading label="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <div className="p-6"><EmptyState icon="📋" title="No appointments found" /></div>
        ) : (
          <>
          <div className="space-y-3 p-3 md:hidden">
            {appointments.map((a) => (
              <article key={a._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.patient?.name || "—"}</p>
                    <p className="truncate text-xs text-slate-500">{a.doctor?.name || "—"}</p>
                  </div>
                  <span className={`badge shrink-0 ${
                    a.status === "booked" ? "bg-blue-100 text-blue-700"
                      : a.status === "completed" ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>{a.status}</span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(a.appointmentDate)} · {formatTimeLabel(a.appointmentTime)}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-sm font-medium text-ink">{currency(a.fee)}</span>
                  {a.status === "booked" ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => act(a._id, "complete")} disabled={busyId === a._id}
                        className="btn-primary min-h-9 px-4 py-2 text-xs">Complete</button>
                      <button type="button" onClick={() => act(a._id, "cancel")} disabled={busyId === a._id}
                        className="btn-danger min-h-9 px-4 py-2 text-xs">Cancel</button>
                    </div>
                  ) : <span className="text-xs text-slate-400">No actions</span>}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-100 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Date &amp; Time</th>
                <th className="hidden px-4 py-3 font-medium xl:table-cell">Fee</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appointments.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-ink">{a.patient?.name || "—"}</td>
                  <td className="px-4 py-3 text-ink">{a.doctor?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(a.appointmentDate)} · {formatTimeLabel(a.appointmentTime)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 xl:table-cell">{currency(a.fee)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      a.status === "booked" ? "bg-blue-100 text-blue-700"
                        : a.status === "completed" ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "booked" ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => act(a._id, "complete")} disabled={busyId === a._id}
                          className="btn-primary min-h-9 px-4 py-2 text-xs">Complete</button>
                        <button type="button" onClick={() => act(a._id, "cancel")} disabled={busyId === a._id}
                          className="btn-danger min-h-9 px-4 py-2 text-xs">Cancel</button>
                      </div>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}