import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiUserCheck, FiUsers, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiDollarSign,
} from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import { currency, formatDate, formatTimeLabel } from "../../utils/format.js";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading dashboard..." />;
  if (!data) return <p className="text-slate-500">No data available.</p>;

  const cards = [
    { label: "Total Doctors", value: data.totals.doctors, icon: FiUserCheck, color: "text-indigo-600 bg-indigo-50" },
    { label: "Total Patients", value: data.totals.patients, icon: FiUsers, color: "text-blue-600 bg-blue-50" },
    { label: "Total Appointments", value: data.totals.appointments, icon: FiCalendar, color: "text-purple-600 bg-purple-50" },
    { label: "Completed", value: data.totals.completed, icon: FiCheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Cancelled", value: data.totals.cancelled, icon: FiXCircle, color: "text-red-600 bg-red-50" },
    { label: "Upcoming", value: data.totals.upcoming, icon: FiClock, color: "text-amber-600 bg-amber-50" },
    { label: "Revenue", value: currency(data.revenue), icon: FiDollarSign, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Dashboard Overview</h2>
      <p className="mt-1 text-sm text-slate-500">Live statistics from the database.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`card p-4 sm:p-5 ${
              c.label === "Revenue" ? "col-span-2 lg:col-span-1" : ""
            }`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-full text-base sm:h-11 sm:w-11 sm:text-lg ${c.color}`}>
              <c.icon />
            </span>
            <p className="mt-3 text-xs leading-snug text-slate-500 sm:text-sm">{c.label}</p>
            <p className="text-xl font-semibold text-ink sm:text-2xl">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Recent appointments</h3>
          <Link to="/admin/appointments" className="inline-flex min-h-9 items-center px-1 text-sm text-primary hover:underline">View all</Link>
        </div>

        <div className="mt-4 space-y-2 md:hidden">
          {data.recentAppointments.map((a) => (
            <div key={a._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{a.patient?.name || "—"}</p>
                  <p className="truncate text-xs text-slate-500">{a.doctor?.name || "—"}</p>
                </div>
                <span className={`badge shrink-0 ${
                  a.status === "completed" ? "bg-green-100 text-green-700"
                    : a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>{a.status}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {formatDate(a.appointmentDate)} · {formatTimeLabel(a.appointmentTime)}
              </p>
            </div>
          ))}
        </div>

        <div className="card mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.recentAppointments.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-3 text-ink">{a.patient?.name || "—"}</td>
                  <td className="px-4 py-3 text-ink">{a.doctor?.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(a.appointmentDate)} · {formatTimeLabel(a.appointmentTime)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      a.status === "completed" ? "bg-green-100 text-green-700"
                        : a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}