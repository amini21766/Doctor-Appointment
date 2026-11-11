import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiCalendar, FiCheckCircle, FiXCircle, FiDollarSign, FiUsers } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Loading from "../../components/Loading.jsx";
import { currency, formatDate, formatTimeLabel, appointmentPhase } from "../../utils/format.js";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/appointments/doctor")
      .then((res) => setAppointments(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todays = appointments.filter((a) => a.appointmentDate === today && a.status === "booked");
    const upcoming = appointments.filter((a) => a.status === "booked" && appointmentPhase(a.appointmentDate, a.appointmentTime) === "upcoming");
    const completed = appointments.filter((a) => a.status === "completed");
    const cancelled = appointments.filter((a) => a.status === "cancelled");
    const uniquePatients = new Set(appointments.map((a) => a.patient?._id)).size;
    const earnings = completed.reduce((sum, a) => sum + (a.fee || 0), 0);
    return { todays, upcoming, completed, cancelled, uniquePatients, earnings };
  }, [appointments]);

  if (loading) return <Loading label="Loading dashboard..." />;

  const cards = [
    { label: "Today's appointments", value: stats.todays.length, icon: FiCalendar },
    { label: "Upcoming", value: stats.upcoming.length, icon: FiCalendar },
    { label: "Completed", value: stats.completed.length, icon: FiCheckCircle },
    { label: "Cancelled", value: stats.cancelled.length, icon: FiXCircle },
    { label: "Total patients", value: stats.uniquePatients, icon: FiUsers },
    { label: "Total earnings", value: currency(stats.earnings), icon: FiDollarSign },
  ];

  return (
    <div className="container-x py-10">
      <h1 className="text-2xl font-bold text-ink">Welcome, {user?.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Here&apos;s an overview of your practice.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to="/doctor-appointments" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-xl text-primary">
              <c.icon />
            </span>
            <div>
              <p className="text-sm text-slate-500">{c.label}</p>
              <p className="text-xl font-semibold text-ink">{c.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Today&apos;s appointments</h2>
          <Link to="/doctor-appointments" className="text-sm text-primary hover:underline">View all</Link>
        </div>

        <div className="mt-4 space-y-3">
          {stats.todays.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No appointments scheduled for today.
            </p>
          ) : (
            stats.todays.map((a) => (
              <div key={a._id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-ink">{a.patient?.name}</p>
                  <p className="text-xs text-slate-500">{formatTimeLabel(a.appointmentTime)} · {formatDate(a.appointmentDate)}</p>
                </div>
                <span className="badge bg-blue-100 text-blue-700">{a.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/doctor-profile" className="btn-outline py-2">Edit profile</Link>
        <Link to="/doctor-availability" className="btn-outline py-2">Manage availability</Link>
      </div>
    </div>
  );
}