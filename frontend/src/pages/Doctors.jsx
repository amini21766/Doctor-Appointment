import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import DoctorGrid from "../components/DoctorGrid.jsx";
import api, { getErrorMessage } from "../services/api.js";

export default function Doctors() {
  const { specialty: routeSpecialty } = useParams();
  const navigate = useNavigate();

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState(routeSpecialty || "");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxFee, setMaxFee] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Keep the sidebar selection in sync with the URL (/doctors/:specialty).
  useEffect(() => {
    setSpecialty(routeSpecialty || "");
    setPage(1);
  }, [routeSpecialty]);

  // Load specialties once for the sidebar.
  useEffect(() => {
    api.get("/specialties")
      .then((res) => setSpecialties(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (specialty) params.specialty = specialty;
      if (availableOnly) params.available = "true";
      if (maxFee) params.maxFee = maxFee;

      const { data } = await api.get("/doctors", { params });
      setDoctors(data.data);
      setPagination(data.pagination || { totalPages: 1, total: data.data.length });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, specialty, availableOnly, maxFee]);

  // Debounced fetch so typing in the search box doesn't spam the API.
  useEffect(() => {
    const t = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(t);
  }, [fetchDoctors]);

  const selectSpecialty = (name) => {
    setPage(1);
    setFiltersOpen(false);
    if (name) navigate(`/doctors/${encodeURIComponent(name)}`);
    else navigate("/doctors");
  };

  const resetFilters = () => {
    setSearch("");
    setAvailableOnly(false);
    setMaxFee("");
    setPage(1);
    setFiltersOpen(false);
    if (routeSpecialty) navigate("/doctors");
  };

  const activeFilters =
    Number(Boolean(specialty)) + Number(availableOnly) + Number(Boolean(maxFee));

  const heading = useMemo(
    () => (specialty ? `${specialty} Doctors` : "All Doctors"),
    [specialty]
  );

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-bold text-ink">{heading}</h1>
      <p className="mt-2 text-sm text-slate-500">Browse through the doctors specialist.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="btn-outline min-h-11 gap-2 px-4 py-2 text-sm"
          aria-expanded={filtersOpen}
          aria-controls="doctor-filters"
        >
          <FiFilter aria-hidden="true" />
          Filters
          {activeFilters > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
              {activeFilters}
            </span>
          )}
        </button>
        {activeFilters > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-medium text-slate-500 hover:text-ink"
          >
            <FiX aria-hidden="true" /> Reset
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:mt-8 lg:flex-row">
        {/* Sidebar */}
        <aside
          id="doctor-filters"
          className={`${filtersOpen ? "block" : "hidden"} w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-56 lg:self-start`}
        >
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">Speciality</h3>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink lg:hidden"
                aria-label="Close filters"
              >
                <FiX />
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => selectSpecialty("")}
                className={`min-h-10 rounded-lg px-3 py-2 text-left text-sm transition ${
                  !specialty ? "bg-primary-light font-medium text-primary" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                All
              </button>
              {specialties.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => selectSpecialty(s.name)}
                  className={`min-h-10 rounded-lg px-3 py-2 text-left text-sm transition ${
                    specialty === s.name
                      ? "bg-primary-light font-medium text-primary"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <label className="mt-5 flex min-h-10 cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Available now
            </label>

            <div className="mt-4">
              <label className="label" htmlFor="maxFee">Max fee</label>
              <input
                id="maxFee"
                type="number"
                min="0"
                value={maxFee}
                onChange={(e) => { setMaxFee(e.target.value); setPage(1); }}
                placeholder="e.g. 60"
                className="input"
              />
            </div>

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink"
              >
                <FiX aria-hidden="true" /> Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="relative mb-6">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search doctors"
              aria-label="Search doctors"
              className="input pl-9"
            />
          </div>

          <DoctorGrid
            doctors={doctors}
            loading={loading}
            showFee
            emptyMessage="No doctors match your search or filters."
          />

          {!loading && pagination.totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              <button
                type="button"
                className="btn-outline min-h-11 px-5 py-2"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="order-first w-full text-center text-sm text-slate-500 sm:order-none sm:w-auto">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn-outline min-h-11 px-5 py-2"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}