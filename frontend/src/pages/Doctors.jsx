import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
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
    if (name) navigate(`/doctors/${encodeURIComponent(name)}`);
    else navigate("/doctors");
  };

  const heading = useMemo(
    () => (specialty ? `${specialty} Doctors` : "All Doctors"),
    [specialty]
  );

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-bold text-ink">{heading}</h1>
      <p className="mt-2 text-sm text-slate-500">Browse through the doctors specialist.</p>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-ink">Speciality</h3>
            <div className="mt-3 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => selectSpecialty("")}
                className={`rounded-lg px-3 py-2 text-left text-sm transition ${
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
                  className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                    specialty === s.name
                      ? "bg-primary-light font-medium text-primary"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              Available now
            </label>

            <div className="mt-5">
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
              placeholder="Search doctors by name or specialty"
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
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn-outline py-2"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn-outline py-2"
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