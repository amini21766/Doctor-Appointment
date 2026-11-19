import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiCopy, FiPlus, FiTrash2 } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Loading from "../../components/Loading.jsx";
import TimeField, { formatDuration } from "../../components/TimeField.jsx";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120];
const MAX_BLOCKS = 6;

let seq = 0;
const newBlock = (startTime = "10:00", endTime = "17:00") => ({
  key: `block-${(seq += 1)}`,
  startTime,
  endTime,
});

const toMinutes = (value) => {
  const [h, m] = String(value || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Minutes since midnight → "HH:mm". */
const toTimeString = (minutes) => {
  const safe = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

const formatLabel = (value) => {
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

/** Expand a day's blocks into bookable slot times (mirrors the backend). */
const buildSlots = (cfg) => {
  if (!cfg?.enabled) return [];
  const step = Math.max(5, Number(cfg.slotDuration) || 30);
  const slots = new Set();
  cfg.sessions.forEach(({ startTime, endTime }) => {
    if (!startTime || !endTime) return;
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    for (let m = start; m + step <= end; m += step) {
      slots.add(toTimeString(m));
    }
  });
  return [...slots].sort((a, b) => toMinutes(a) - toMinutes(b));
};

/** Convert the API shape (including legacy single-block days) to editable state. */
const normalizeWeek = (weeklyAvailability) => {
  const week = {};
  DAYS.forEach((day) => {
    const cfg = weeklyAvailability?.[day] || {};
    const sessions = Array.isArray(cfg.sessions) && cfg.sessions.length
      ? cfg.sessions.map((s) => newBlock(s.startTime, s.endTime))
      : [newBlock(cfg.startTime || "10:00", cfg.endTime || "17:00")];
    week[day] = {
      enabled: Boolean(cfg.enabled),
      slotDuration: Number(cfg.slotDuration) || 30,
      sessions,
    };
  });
  return week;
};

const serializeWeek = (week) => {
  const payload = {};
  DAYS.forEach((day) => {
    const cfg = week[day];
    const sessions = cfg.sessions
      .filter((session) => session.startTime && session.endTime)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
      .map(({ startTime, endTime }) => ({ startTime, endTime }));
    payload[day] = {
      enabled: cfg.enabled,
      slotDuration: Number(cfg.slotDuration) || 30,
      sessions,
      // Legacy mirrors of the first block, kept for older clients.
      startTime: sessions[0]?.startTime || "10:00",
      endTime: sessions[0]?.endTime || "17:00",
    };
  });
  return payload;
};

/** Per-day rules (mirrors the backend). Returns an error message or null. */
const validateDay = (cfg) => {
  if (!cfg.enabled) return null;

  if (cfg.sessions.length === 0) return "Add at least one time block.";
  if (cfg.sessions.length > MAX_BLOCKS) return `Use at most ${MAX_BLOCKS} time blocks.`;

  const blocks = [];
  for (const session of cfg.sessions) {
    if (!session.startTime || !session.endTime) return "Every time block needs a start and end time.";
    if (toMinutes(session.endTime) <= toMinutes(session.startTime)) {
      return "The end time must be after the start time.";
    }
    blocks.push({ start: toMinutes(session.startTime), end: toMinutes(session.endTime) });
  }

  blocks.sort((a, b) => a.start - b.start);
  for (let i = 1; i < blocks.length; i += 1) {
    if (blocks[i].start < blocks[i - 1].end) return "Time blocks cannot overlap.";
  }

  if (buildSlots(cfg).length === 0) {
    return `Each block must be at least ${cfg.slotDuration} minutes long (your appointment length).`;
  }
  return null;
};

/** Whole-week validation used before saving. */
const validateWeek = (week) => {
  for (const day of DAYS) {
    const error = validateDay(week[day]);
    if (error) return `${day}: ${error.charAt(0).toLowerCase()}${error.slice(1)}`;
  }
  return null;
};

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [week, setWeek] = useState(null);
  const [savedWeek, setSavedWeek] = useState(null);
  const [available, setAvailable] = useState(true);
  const [savedAvailable, setSavedAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.doctorId) return;
        const { data } = await api.get(`/doctors/${user.doctorId}`);
        setDoctor(data.data);
        setAvailable(Boolean(data.data.available));
        setSavedAvailable(Boolean(data.data.available));
        const normalized = normalizeWeek(data.data.weeklyAvailability);
        setWeek(normalized);
        setSavedWeek(normalized);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const dirty = useMemo(() => {
    if (!week || !savedWeek) return false;
    return (
      JSON.stringify(serializeWeek(week)) !== JSON.stringify(serializeWeek(savedWeek)) ||
      available !== savedAvailable
    );
  }, [week, savedWeek, available, savedAvailable]);

  const weeklySlots = useMemo(
    () => (week ? DAYS.reduce((total, day) => total + buildSlots(week[day]).length, 0) : 0),
    [week]
  );

  const weekError = useMemo(() => (week ? validateWeek(week) : null), [week]);

  const updateDay = (day, patch) =>
    setWeek((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  const toggleDay = (day, enabled) =>
    setWeek((prev) => {
      const cfg = prev[day];
      const sessions = enabled && cfg.sessions.length === 0 ? [newBlock()] : cfg.sessions;
      return { ...prev, [day]: { ...cfg, enabled, sessions } };
    });

  const updateBlock = (day, key, patch) =>
    setWeek((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        sessions: prev[day].sessions.map((s) => (s.key === key ? { ...s, ...patch } : s)),
      },
    }));

  const addBlock = (day) =>
    setWeek((prev) => {
      const { sessions } = prev[day];
      if (sessions.length >= MAX_BLOCKS) return prev;
      const lastEnd = toMinutes(sessions[sessions.length - 1]?.endTime || "17:00");
      const start = Math.max(Math.min(lastEnd + 30, 23 * 60), lastEnd);
      const end = Math.max(Math.min(start + 120, 23 * 60 + 30), start + 5);
      return {
        ...prev,
        [day]: { ...prev[day], sessions: [...sessions, newBlock(toTimeString(start), toTimeString(end))] },
      };
    });

  const removeBlock = (day, key) =>
    setWeek((prev) => ({
      ...prev,
      [day]: { ...prev[day], sessions: prev[day].sessions.filter((s) => s.key !== key) },
    }));

  const copyToAll = (day) => {
    setWeek((prev) => {
      const source = prev[day];
      const next = {};
      DAYS.forEach((target) => {
        next[target] = {
          enabled: source.enabled,
          slotDuration: source.slotDuration,
          sessions: source.sessions.map((s) => newBlock(s.startTime, s.endTime)),
        };
      });
      return next;
    });
    toast.info(`${day}'s hours copied to every day`);
  };

  const clearAllDays = () => {
    setWeek((prev) => {
      const next = {};
      DAYS.forEach((day) => {
        next[day] = { ...prev[day], enabled: false };
      });
      return next;
    });
  };

  const discard = () => {
    setWeek(savedWeek);
    setAvailable(savedAvailable);
  };

  const save = async () => {
    if (!doctor || !week) return;
    const error = validateWeek(week);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put(`/doctors/${doctor._id}/availability`, {
        weeklyAvailability: serializeWeek(week),
        available,
      });
      const normalized = normalizeWeek(data.data.weeklyAvailability);
      setDoctor(data.data);
      setWeek(normalized);
      setSavedWeek(normalized);
      setAvailable(Boolean(data.data.available));
      setSavedAvailable(Boolean(data.data.available));
      toast.success("Availability updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading availability..." />;
  if (!doctor || !week) {
    return <div className="container-x py-20 text-center text-slate-500">Doctor profile not found.</div>;
  }

  return (
    <div className="container-x py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Manage Availability</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Split each day into as many time blocks as you need and choose how long each appointment lasts.
            Patients can only book the slots you generate here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {dirty && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Unsaved changes
            </span>
          )}
          <button type="button" onClick={discard} className="btn-outline min-h-11 py-2 text-sm" disabled={!dirty || saving}>
            Discard
          </button>
          <button
            type="button"
            onClick={save}
            className="btn-primary min-h-11 py-2 text-sm"
            disabled={saving || Boolean(weekError)}
            title={weekError || undefined}
          >
            {saving ? "Saving..." : "Save availability"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-primary"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          Currently accepting appointments
        </label>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {weeklySlots} bookable slot{weeklySlots === 1 ? "" : "s"} per week
        </span>
        <button
          type="button"
          onClick={clearAllDays}
          className="inline-flex min-h-9 items-center text-xs font-medium text-slate-500 underline-offset-2 hover:text-ink hover:underline"
        >
          Clear all days
        </button>
      </div>

      {!available && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are not accepting new appointments. Your schedule stays saved, but patients cannot book until you turn
          this back on.
        </p>
      )}

      {weekError && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {weekError}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {DAYS.map((day) => {
          const cfg = week[day];
          const slots = buildSlots(cfg);
          const dayError = validateDay(cfg);
          return (
            <div key={day} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary"
                    checked={cfg.enabled}
                    onChange={(e) => toggleDay(day, e.target.checked)}
                  />
                  <span className="w-24">{day}</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500" htmlFor={`duration-${day}`}>
                    Appointment length
                  </label>
                  <select
                    id={`duration-${day}`}
                    className="input w-28 py-2 text-sm"
                    value={cfg.slotDuration}
                    disabled={!cfg.enabled}
                    onChange={(e) => updateDay(day, { slotDuration: Number(e.target.value) })}
                  >
                    {DURATION_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {cfg.enabled ? (
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    {cfg.sessions.map((session, index) => {
                      const blockStart = toMinutes(session.startTime);
                      const blockEnd = toMinutes(session.endTime);
                      const invalidBlock = blockEnd <= blockStart;
                      const duration = formatDuration(blockEnd - blockStart);
                      return (
                        <div
                          key={session.key}
                          className={`flex flex-wrap items-center gap-2 rounded-xl px-2 py-1.5 ${
                            invalidBlock ? "bg-rose-50 ring-1 ring-rose-200" : "bg-slate-50"
                          }`}
                        >
                          <TimeField
                            value={session.startTime}
                            onChange={(next) => updateBlock(day, session.key, { startTime: next })}
                            ariaLabel={`${day} block ${index + 1} start time`}
                            invalid={invalidBlock}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">to</span>
                            <TimeField
                              value={session.endTime}
                              onChange={(next) => updateBlock(day, session.key, { endTime: next })}
                              ariaLabel={`${day} block ${index + 1} end time`}
                              invalid={invalidBlock}
                            />
                          </div>
                          <span
                            className={`badge ${
                              invalidBlock ? "bg-rose-100 text-rose-700" : "bg-white text-slate-500 shadow-sm"
                            }`}
                          >
                            {invalidBlock ? "check times" : duration || "—"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeBlock(day, session.key)}
                            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Remove time block"
                            aria-label={`Remove ${day} block ${index + 1}`}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                    {cfg.sessions.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No time blocks yet — add one to make this day bookable.
                      </p>
                    )}
                    {dayError && <p className="text-xs font-medium text-rose-600">{dayError}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => addBlock(day)}
                      disabled={cfg.sessions.length >= MAX_BLOCKS}
                      className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiPlus className="h-4 w-4" /> Add time block
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToAll(day)}
                      className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink"
                    >
                      <FiCopy className="h-4 w-4" /> Copy to all days
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {slots.length} slot{slots.length === 1 ? "" : "s"}
                    </span>
                    {slots.slice(0, 10).map((slot) => (
                      <span
                        key={slot}
                        className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm"
                      >
                        {formatLabel(slot)}
                      </span>
                    ))}
                    {slots.length > 10 && (
                      <span className="text-xs text-slate-400">+{slots.length - 10} more</span>
                    )}
                    {slots.length === 0 && (
                      <span className="text-xs text-amber-600">
                        Blocks are shorter than the appointment length.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Not bookable — patients see no slots on {day}.</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Changing your schedule never moves appointments that are already booked; it only affects future slots.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="btn-primary"
          disabled={saving || Boolean(weekError)}
          title={weekError || undefined}
        >
          {saving ? "Saving..." : "Save availability"}
        </button>
        {weekError ? (
          <span className="text-sm text-rose-600">Fix the highlighted day before saving.</span>
        ) : (
          dirty && <span className="text-sm text-slate-500">You have unsaved changes.</span>
        )}
      </div>
    </div>
  );
}
