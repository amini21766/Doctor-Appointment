import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import Loading from "../components/Loading.jsx";
import AppointmentSlots from "../components/AppointmentSlots.jsx";
import api, { getErrorMessage, resolveImageUrl } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { currency } from "../utils/format.js";
import { useNavigate } from "react-router-dom";

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // Load the doctor profile.
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/doctors/${id}`)
      .then((res) => { if (active) setDoctor(res.data.data); })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  // Load availability (dates + first day's slots).
  const loadSlots = useCallback(async (date) => {
    setSlotsLoading(true);
    try {
      const url = date ? `/doctors/${id}/availability?date=${date}` : `/doctors/${id}/availability`;
      const { data } = await api.get(url);
      const payload = data.data;
      if (!date) {
        setDates(payload.upcomingDates || []);
        const first = payload.upcomingDates?.[0]?.date;
        if (first) setSelectedDate(first);
      }
      setSlots(payload.slots || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSlotsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const onSelectDate = async (date) => {
    setSelectedDate(date);
    setSelectedTime("");
    await loadSlots(date);
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to book an appointment");
      navigate("/login", { state: { from: `/doctor/${id}` } });
      return;
    }
    if (user.role !== "patient") {
      toast.error("Only patients can book appointments");
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and a time slot");
      return;
    }

    setBooking(true);
    try {
      await api.post("/appointments", {
        doctorId: id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
      });
      toast.success("Appointment booked successfully");
      setSelectedTime("");
      await loadSlots(selectedDate);
    } catch (err) {
      toast.error(getErrorMessage(err));
      await loadSlots(selectedDate);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <Loading label="Loading doctor details..." />;
  if (!doctor) return <div className="container-x py-20 text-center text-slate-500">Doctor not found.</div>;

  const image = resolveImageUrl(doctor.image);

  return (
    <div className="container-x py-10">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left: photo */}
        <div>
          <div className="overflow-hidden rounded-2xl bg-primary-light">
            {image ? (
              <img src={image} alt={doctor.name} className="h-[340px] w-full object-cover object-top" />
            ) : (
              <div className="flex h-[340px] items-center justify-center text-6xl text-primary/40">
                {doctor.name?.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Right: info */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">{doctor.name}</h1>
            <FiCheckCircle className="text-primary" title="Verified" />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="badge bg-primary-light text-primary">
              {doctor.degree} - {doctor.specialty?.name}
            </span>
            <span className="badge bg-slate-100 text-slate-600">{doctor.experience}</span>
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-semibold text-ink">About</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {doctor.about || "No biography available."}
            </p>
          </div>

          <p className="mt-5 text-sm font-medium text-ink">
            Appointment fee: <span className="text-primary">{currency(doctor.fees)}</span>
          </p>

          {!doctor.available && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This doctor is currently not accepting new appointments.
            </p>
          )}
        </div>
      </div>

      {/* Booking */}
      <div className="mt-10 max-w-3xl">
        <AppointmentSlots
          dates={dates}
          slots={slots}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelectDate={onSelectDate}
          onSelectTime={setSelectedTime}
          slotsLoading={slotsLoading}
          onBook={handleBook}
          booking={booking}
          canBook={Boolean(selectedDate && selectedTime && doctor.available)}
          fee={doctor.fees}
        />
      </div>
    </div>
  );
}