import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiSearch, FiPlus } from "react-icons/fi";
import api, { getErrorMessage, resolveImageUrl } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { currency } from "../../utils/format.js";

const MOBILE_PAGE_SIZE = 6;

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [mobilePage, setMobilePage] = useState(1);
  const mobileListRef = useRef(null);

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

  useEffect(() => {
    setMobilePage(1);
  }, [search]);

  useEffect(() => {
    setMobilePage((page) => Math.min(page, Math.max(1, Math.ceil(doctors.length / MOBILE_PAGE_SIZE))));
  }, [doctors.length]);

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

  const mobilePageCount = Math.max(1, Math.ceil(doctors.length / MOBILE_PAGE_SIZE));
  const currentMobilePage = Math.min(mobilePage, mobilePageCount);
  const mobileStart = (currentMobilePage - 1) * MOBILE_PAGE_SIZE;
  const mobileDoctors = doctors.slice(mobileStart, mobileStart + MOBILE_PAGE_SIZE);
  const mobileRangeEnd = Math.min(mobileStart + MOBILE_PAGE_SIZE, doctors.length);

  const changeMobilePage = (next) => {
    const target = Math.min(Math.max(1, next), mobilePageCount);
    if (target === currentMobilePage) return;
    setMobilePage(target);
    window.requestAnimationFrame(() => {
      const list = mobileListRef.current;
      if (!list) return;
      list.focus({ preventScroll: true });
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      list.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">Manage Doctors</h2>
        <Link to="/admin/add-doctor" className="btn-primary min-h-11 py-2"><FiPlus /> Add Doctor</Link>
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
        <>
          <div
            ref={mobileListRef}
            id="admin-doctor-list"
            role="list"
            aria-label="Doctors"
            tabIndex={-1}
            className="mt-5 scroll-mt-20 space-y-3 focus:outline-none md:hidden"
          >
            {mobileDoctors.map((d) => {
              const img = resolveImageUrl(d.image);
              return (
                <article key={d._id} role="listitem" className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary-light">
                      {img ? <img src={img} alt={d.name} className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center text-xs text-primary">{d.name?.charAt(0)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{d.name}</p>
                      <p className="truncate text-xs text-slate-400">{d.email}</p>
                    </div>
                    <span className={`badge shrink-0 ${d.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span className="min-w-0 truncate">{d.specialty?.name || "—"}</span>
                    <span className="shrink-0 font-medium text-ink">{currency(d.fees)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleStatus(d)} disabled={busyId === d._id}
                      className="btn-outline min-h-10 flex-1 px-3 py-2 text-xs">
                      {d.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                    <button type="button" onClick={() => remove(d)} disabled={busyId === d._id}
                      className="btn-danger min-h-10 flex-1 px-3 py-2 text-xs">Delete</button>
                  </div>
                </article>
              );
            })}
          </div>

          {mobilePageCount > 1 && (
            <nav
              aria-label="Doctor list pagination"
              className="mt-3 flex flex-wrap items-center justify-center gap-2 md:hidden"
            >
              <p className="w-full text-center text-xs text-slate-500" aria-live="polite">
                Showing {mobileStart + 1}–{mobileRangeEnd} of {doctors.length} doctors
              </p>
              <button
                type="button"
                onClick={() => changeMobilePage(currentMobilePage - 1)}
                disabled={currentMobilePage <= 1}
                aria-controls="admin-doctor-list"
                className="btn-outline min-h-10 px-4 py-2 text-xs"
              >
                Previous
              </button>
              <span className="px-1 text-xs font-medium text-slate-600">
                Page {currentMobilePage} of {mobilePageCount}
              </span>
              <button
                type="button"
                onClick={() => changeMobilePage(currentMobilePage + 1)}
                disabled={currentMobilePage >= mobilePageCount}
                aria-controls="admin-doctor-list"
                className="btn-outline min-h-10 px-4 py-2 text-xs"
              >
                Next
              </button>
            </nav>
          )}

          <div className="card mt-5 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-100 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="hidden px-4 py-3 font-medium xl:table-cell">Fee</th>
                <th className="hidden px-4 py-3 font-medium xl:table-cell">Status</th>
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
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate font-medium text-ink">{d.name}</p>
                          <p className="max-w-[240px] truncate text-xs text-slate-400">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.specialty?.name || "—"}</td>
                    <td className="hidden px-4 py-3 text-slate-600 xl:table-cell">{currency(d.fees)}</td>
                    <td className="hidden px-4 py-3 xl:table-cell">
                      <span className={`badge ${d.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => toggleStatus(d)} disabled={busyId === d._id}
                          className="btn-outline min-h-9 px-4 py-2 text-xs">
                          {d.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                        <button type="button" onClick={() => remove(d)} disabled={busyId === d._id}
                          className="btn-danger min-h-9 px-4 py-2 text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}