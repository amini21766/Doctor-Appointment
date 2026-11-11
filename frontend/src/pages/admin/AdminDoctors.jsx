import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiSearch, FiPlus } from "react-icons/fi";
import api, { getErrorMessage, resolveImageUrl } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { currency } from "../../utils/format.js";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/doctors", { params: { search: search || undefined } });
      setDoctors(data.data);
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

  const toggleStatus = async (doctor) => {
    setBusyId(doctor._id);
    try {
      await api.patch(`/admin/doctors/${doctor._id}/status`, { isActive: !doctor.isActive });
      toast.success(doctor.isActive ? "Doctor deactivated" : "Doctor reactivated");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (doctor) => {
    if (!window.confirm(`Delete ${doctor.name}? This cannot be undone.`)) return;
    setBusyId(doctor._id);
    try {
      const { data } = await api.delete(`/doctors/${doctor._id}`);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">Manage Doctors</h2>
        <Link to="/admin/add-doctor" className="btn-primary py-2"><FiPlus /> Add Doctor</Link>
      </div>

      <div className="relative mt-5 max-w-md">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="search" className="input pl-9" placeholder="Search doctors by name"
          value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search doctors" />
      </div>

      {loading ? (
        <Loading label="Loading doctors..." />
      ) : doctors.length === 0 ? (
        <div className="mt-5"><EmptyState icon="🩺" title="No doctors found" /></div>
      ) : (
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-100 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doctors.map((d) => {
                const img = resolveImageUrl(d.image);
                return (
                  <tr key={d._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-primary-light">
                          {img ? <img src={img} alt={d.name} className="h-full w-full object-cover" />
                            : <span className="flex h-full w-full items-center justify-center text-xs text-primary">{d.name?.charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="font-medium text-ink">{d.name}</p>
                          <p className="text-xs text-slate-400">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.specialty?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{currency(d.fees)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${d.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => toggleStatus(d)} disabled={busyId === d._id}
                          className="btn-outline py-1.5 text-xs">
                          {d.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                        <button type="button" onClick={() => remove(d)} disabled={busyId === d._id}
                          className="btn-danger py-1.5 text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}