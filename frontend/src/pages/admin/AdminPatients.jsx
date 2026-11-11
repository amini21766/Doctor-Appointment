import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiSearch } from "react-icons/fi";
import api, { getErrorMessage, resolveImageUrl } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";
import { formatDate, formatTimeLabel } from "../../utils/format.js";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/patients", { params: { search: search || undefined } });
      setPatients(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = async (patient) => {
    setDetail({ patient, appointments: [] });
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/patients/${patient._id}`);
      setDetail(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Manage Patients</h2>

      <div className="relative mt-5 max-w-md">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="search" className="input pl-9" placeholder="Search by name, email or phone"
          value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search patients" />
      </div>

      {loading ? (
        <Loading label="Loading patients..." />
      ) : patients.length === 0 ? (
        <div className="mt-5"><EmptyState icon="🧑" title="No patients found" /></div>
      ) : (
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-100 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Appointments</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map((p) => {
                const img = resolveImageUrl(p.profileImage);
                return (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-primary-light">
                          {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" />
                            : <span className="flex h-full w-full items-center justify-center text-xs text-primary">{p.name?.charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="font-medium text-ink">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.appointmentCount}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openDetail(p)} className="btn-outline py-1.5 text-xs">
                        View details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.patient?.name} maxWidth="max-w-2xl">
        {detailLoading ? (
          <Loading label="Loading patient..." />
        ) : (
          <div>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p><span className="font-medium text-ink">Email:</span> {detail?.patient?.email}</p>
              <p><span className="font-medium text-ink">Phone:</span> {detail?.patient?.phone || "—"}</p>
            </div>

            <h4 className="mt-6 text-sm font-semibold text-ink">Appointment history</h4>
            {detail?.appointments?.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No appointments yet.</p>
            ) : (
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                {detail?.appointments?.map((a) => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                    <div>
                      <p className="text-ink">{a.doctor?.name || "—"}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.appointmentDate)} · {formatTimeLabel(a.appointmentTime)}</p>
                    </div>
                    <span className={`badge ${
                      a.status === "completed" ? "bg-green-100 text-green-700"
                        : a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}