import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useDashboardStore, { formatCurrency } from "../../store/useDashboardStore";
import quoteService from "../../services/quoteService";
import bookingService from "../../services/bookingService";
import paymentService from "../../services/paymentService";
import { formatDateHuman, formatLocalDate } from "../../utils/dateUtils";
import { NodeURL } from "../../services/api";

// ─── Journey Progress Bar ────────────────────────────────────────────────────

const STEPS = [
  { label: "Sent" },
  { label: "Providers" },
  { label: "Reviewed" },
  { label: "Paid" },
  { label: "Book Appt" },
  { label: "Confirmed" },
];

const JourneyProgress = ({ currentStep = 4 }) => (
  <div className="qdp-stepper bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-5 mb-6 shadow-sm">
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isDone = currentStep >= 0 && i < currentStep;
        const isNow = currentStep >= 0 && i === currentStep;

        return (
          <div
            key={i}
            className={[
              "flex-1 flex flex-col items-center relative",
              i < STEPS.length - 1
                ? `after:content-[''] after:absolute after:left-1/2 after:top-3 sm:after:top-4 after:w-full after:h-0.5 after:z-0 ${
                    isDone && i < STEPS.length - 1
                      ? "after:bg-green-500"
                      : isNow && i < STEPS.length - 1
                        ? "after:bg-gradient-to-r after:from-primary-500 after:to-slate-200 dark:after:to-slate-600"
                        : "after:bg-slate-200 dark:after:bg-slate-600"
                  }`
                : "",
            ].join(" ")}
          >
            <div
              className={[
                "qdp-step-circle w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center relative z-10 text-[10px] sm:text-xs font-bold transition-all",
                isDone
                  ? "bg-green-600 text-white"
                  : isNow
                    ? "bg-primary-600 text-white shadow-[0_0_0_3px] sm:shadow-[0_0_0_4px] shadow-primary-100 dark:shadow-primary-900/40"
                    : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400",
              ].join(" ")}
            >
              {isDone ? <Check size={12} /> : i + 1}
            </div>
            <p
              className={[
                "qdp-step-label font-semibold mt-1 sm:mt-2 text-center leading-tight text-[8px] sm:text-[10px]",
                isDone
                  ? "text-green-600 dark:text-green-400"
                  : isNow
                    ? "text-primary-700 dark:text-primary-400 font-bold"
                    : "text-slate-400 dark:text-slate-500",
              ].join(" ")}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Provider Paid Bar ───────────────────────────────────────────────────────

const ProviderPaidBar = ({ providerName, service, vehicle, amount, avatarUrl }) => {
  const initials = (providerName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 mb-6 flex items-center gap-3 sm:gap-4 flex-wrap">
      {/* Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={providerName}
          style={{
            width: 48,
            height: 48,
            borderRadius: "1rem",
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: "0 4px 6px -1px rgba(15,23,42,.08)",
          }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: ".875rem",
            flexShrink: 0,
            background: "linear-gradient(135deg, #16A34A, #15803D)",
            boxShadow: "0 4px 6px -1px rgba(15,23,42,.08)",
          }}
        >
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
          {providerName || "Provider"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {service}
          {vehicle ? ` · ${vehicle}` : ""}
        </p>
      </div>

      {/* Amount + badge */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(amount)}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
          <Check size={11} />
          Paid in full
        </span>
      </div>
    </div>
  );
};

// ─── Calendar Component ──────────────────────────────────────────────────────

const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CalendarPicker = ({ selectedDate, onDateSelect, availabilityCache, onMonthChange, isPrefetching }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const goToPrevMonth = () => {
    let newMonth, newYear;
    if (viewMonth === 0) {
      newMonth = 11;
      newYear = viewYear - 1;
    } else {
      newMonth = viewMonth - 1;
      newYear = viewYear;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const goToNextMonth = () => {
    let newMonth, newYear;
    if (viewMonth === 11) {
      newMonth = 0;
      newYear = viewYear + 1;
    } else {
      newMonth = viewMonth + 1;
      newYear = viewYear;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  // Build the grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  // ISO week: Monday = 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Can we go back? Only allow navigation to current month or future
  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const cells = [];
  // Leading empty cells
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const getDateStr = (day) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${dd}`;
  };

  const isPastOrToday = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return d <= today;
  };

  const isToday = (day) => {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelected = (day) => {
    return selectedDate === getDateStr(day);
  };

  const hasSlots = (day) => {
    const dateStr = getDateStr(day);
    const cached = availabilityCache[dateStr];
    return cached && cached.slots && cached.slots.length > 0;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>

        <div className="flex gap-2">
          <button
            onClick={goToPrevMonth}
            disabled={isCurrentMonth}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={goToNextMonth}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 pt-3 relative">
        {/* Loading overlay while prefetching availability */}
        {isPrefetching && Object.keys(availabilityCache).length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-b-2xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Loading availability...</span>
            </div>
          </div>
        )}

        {/* Day name headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const past = isPastOrToday(day);
            const todayDay = isToday(day);
            const selected = isSelected(day);
            const slots = !past && hasSlots(day);

            return (
              <div key={day} className="flex flex-col items-center relative">
                <button
                  onClick={() => !past && onDateSelect(getDateStr(day))}
                  disabled={past}
                  aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                  aria-pressed={selected}
                  className={[
                    "w-9 h-9 rounded-lg text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative",
                    selected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                      : todayDay
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold"
                        : past
                          ? "text-slate-300 dark:text-slate-600 cursor-not-allowed line-through decoration-slate-200"
                          : slots
                            ? "text-slate-900 dark:text-slate-100 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer",
                  ].join(" ")}
                >
                  {day}
                </button>
                {/* Green dot for days with available slots */}
                {slots && !selected && (
                  <div className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                )}
                {selected && (
                  <div className="w-1 h-1 rounded-full bg-white/70 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Time Slots Panel ────────────────────────────────────────────────────────

const formatDateLong = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return "";
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const year = date.getFullYear();
  return `${weekday} ${day} ${month} ${year}`;
};

// ─── Time/Duration Helpers ────────────────────────────────────────────────────

const timeToMins = (t) => {
  if (!t || typeof t !== "string") return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minsToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const computeEndTime = (startTime, durationMins) => {
  return minsToTime(timeToMins(startTime) + durationMins);
};

const formatDuration = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr${h > 1 ? "s" : ""}`;
  return `${m} min`;
};

// ─── TimeSlotsPanel ──────────────────────────────────────────────────────────

const TimeSlotsPanel = ({ selectedDate, selectedSlot, onSlotSelect, slots, isLoading, slotsNeeded = 2, estimatedDuration = 60 }) => {
  if (!selectedDate) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center justify-center min-h-[240px] text-center">
        <Calendar size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Select a date to see available times
        </p>
      </div>
    );
  }

  // "Thursday 9 January — Available Times"
  const dateLongNoYear = (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return "";
    const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-GB", { month: "long" });
    return `${weekday} ${day} ${month}`;
  })();

  // Build lookup for slot index and status
  const slotTimes = slots.map((s) => (typeof s === "string" ? s : s.time));
  const slotStatusMap = {};
  for (const s of slots) {
    const t = typeof s === "string" ? s : s.time;
    slotStatusMap[t] = typeof s === "string" ? "available" : s.status;
  }

  // Check if slotTime is a valid start (enough consecutive available slots exist)
  const isValidStart = (slotTime) => {
    if (slotStatusMap[slotTime] === "taken" || slotStatusMap[slotTime] === "buffer") return false;
    const idx = slotTimes.indexOf(slotTime);
    if (idx === -1) return false;
    if (idx + slotsNeeded > slotTimes.length) return false;
    const startMins = timeToMins(slotTime);
    for (let i = 0; i < slotsNeeded; i++) {
      const expectedTime = minsToTime(startMins + i * 30);
      const candidateTime = slotTimes[idx + i];
      if (candidateTime !== expectedTime) return false; // gap (e.g. lunch break)
      if (slotStatusMap[candidateTime] === "taken" || slotStatusMap[candidateTime] === "buffer") return false;
    }
    return true;
  };

  // Get set of all slots covered by a selection
  const getCoveredSlots = (startTime) => {
    if (!startTime) return new Set();
    const startMins = timeToMins(startTime);
    const covered = new Set();
    for (let i = 0; i < slotsNeeded; i++) {
      covered.add(minsToTime(startMins + i * 30));
    }
    return covered;
  };

  const coveredSlots = selectedSlot ? getCoveredSlots(selectedSlot) : new Set();
  const lastCoveredSlot = selectedSlot && slotsNeeded > 1
    ? minsToTime(timeToMins(selectedSlot) + (slotsNeeded - 1) * 30)
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-md">
      <h3
        className="font-bold text-[15px] text-slate-900 dark:text-slate-100 mb-3"
        style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
      >
        {dateLongNoYear} — Available Times
      </h3>

      {/* Duration info banner */}
      {slotsNeeded > 1 && !isLoading && slots.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Clock size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Service duration: <span className="font-semibold">{formatDuration(estimatedDuration)}</span> ({slotsNeeded} consecutive slots needed)
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No available slots on this date
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Please choose another day
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => {
            const slotTime = typeof slot === "string" ? slot : slot.time;
            const isTaken = slotStatusMap[slotTime] === "taken";
            const isBuffer = slotStatusMap[slotTime] === "buffer";
            const validStart = !isTaken && !isBuffer && isValidStart(slotTime);
            const isSelectedStart = selectedSlot === slotTime;
            const isHighlighted = !isSelectedStart && coveredSlots.has(slotTime);
            const isLastSlot = slotTime === lastCoveredSlot;
            const cantStart = !isTaken && !isBuffer && !validStart;
            const isDisabled = isTaken || isBuffer || cantStart;

            return (
              <button
                key={slotTime}
                onClick={() => validStart && onSlotSelect(slotTime)}
                disabled={isDisabled}
                className={[
                  "px-2 py-2.5 rounded-lg border-[1.5px] text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isTaken
                    ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                    : isBuffer
                      ? "bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-dashed border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50"
                    : isSelectedStart || isHighlighted
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25"
                        : cantStart
                          ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                ].join(" ")}
              >
                <div className="text-sm font-semibold">
                  {`${slotTime} - ${minsToTime(timeToMins(slotTime) + 30)}`}
                </div>
                <div className={[
                  "text-[10px] mt-0.5",
                  isTaken
                    ? "text-slate-400 dark:text-slate-500"
                    : isBuffer
                      ? "text-slate-400 dark:text-slate-500"
                    : isSelectedStart || isHighlighted
                      ? "text-white/70"
                        : cantStart
                          ? "text-slate-400 dark:text-slate-500"
                          : "opacity-70",
                ].join(" ")}>
                  {isTaken ? "Taken" : isBuffer ? "Buffer" : isSelectedStart ? "Start" : isHighlighted ? "Included" : cantStart ? "Unavailable" : "Available"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Appointment Summary Card ─────────────────────────────────────────────────

const AppointmentSummary = ({
  selectedDate,
  selectedSlot,
  providerName,
  serviceLines,
  vehicle,
  location,
  registrationNumber,
  onConfirm,
  isConfirming,
  estimatedDuration = 60,
  slotsNeeded = 2,
  isReschedule = false,
}) => {
  const slotDuration = slotsNeeded * 30;
  const endTime = selectedSlot && slotsNeeded > 1
    ? computeEndTime(selectedSlot, slotDuration)
    : null;
  const timeDisplay = selectedSlot && endTime
    ? `${selectedSlot} — ${endTime} (${formatDuration(slotDuration)})`
    : selectedSlot;

  const rows = [
    { label: "Date", value: formatDateLong(selectedDate) },
    { label: "Time", value: timeDisplay },
    { label: "Provider", value: providerName },
    {
      label: "Service",
      value:
        serviceLines.length > 1 ? (
          <span className="flex flex-col items-end gap-0.5">
            {serviceLines.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </span>
        ) : (
          serviceLines[0] || "—"
        ),
    },
    {
      label: "Vehicle",
      value: (
        <>
          {vehicle}
          {registrationNumber && (
            <>
              {" · "}
              <span className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 inline-block">
                {registrationNumber}
              </span>
            </>
          )}
        </>
      ),
    },
    { label: "Location", value: location },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mt-5 shadow-md">
      <h3
        className="font-bold text-[15px] text-slate-900 dark:text-slate-100 mb-3.5"
        style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
      >
        Appointment Summary
      </h3>

      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between py-1.5 text-sm"
        >
          <span className="text-slate-500 dark:text-slate-400">{label}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {value || "—"}
          </span>
        </div>
      ))}

      <button
        onClick={onConfirm}
        disabled={isConfirming}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold text-sm transition-all mt-5 shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {isConfirming ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Calendar size={16} />
        )}
        {isConfirming ? "Confirming..." : isReschedule ? "Reschedule Appointment" : "Confirm Appointment"}
      </button>
    </div>
  );
};

// ─── Confirmed Modal ──────────────────────────────────────────────────────────

const ConfirmedModal = ({ isOpen, bookingReference, selectedDate, selectedSlot, onViewBookings, slotsNeeded = 2, isReschedule = false }) => {
  if (!isOpen) return null;

  // "Thursday 9 Jan, 09:00 — 10:30" format
  const slotDuration = slotsNeeded * 30;
  const apptText = (() => {
    if (!selectedDate || !selectedSlot) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return "";
    const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    const endTime = slotsNeeded > 1
      ? computeEndTime(selectedSlot, slotDuration)
      : null;
    const timeStr = endTime
      ? `${selectedSlot} — ${endTime}`
      : selectedSlot;
    return `${weekday} ${day} ${month}, ${timeStr}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-7 pb-5 text-center">
          {/* Calendar icon */}
          <div
            className="w-[64px] h-[64px] rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)", boxShadow: "0 8px 24px rgba(37,99,235,.35)" }}
          >
            <Calendar size={32} className="text-white" />
          </div>

          {/* Title + subtitle */}
          <h2
            className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
          >
            {isReschedule ? "Appointment Rescheduled!" : "You\u2019re all booked!"}
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            {isReschedule
              ? "Your appointment has been rescheduled. The provider has been notified of the change."
              : "Your appointment is confirmed. The provider will contact you to confirm the exact arrival window."}
          </p>

          {/* Booking reference */}
          {bookingReference && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-5 inline-block text-center mb-3">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Booking Reference
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-wider font-mono">
                {bookingReference}
              </p>
            </div>
          )}

          {/* Next steps — card wrapped rows */}
          <div className="flex flex-col gap-2 text-left mb-4">
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg py-2.5 px-3.5">
              <Mail size={14} className="text-blue-500 flex-shrink-0" />
              <span className="text-[13px] text-slate-600 dark:text-slate-400">
                Confirmation sent with your appointment details.
              </span>
            </div>

            {apptText && (
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg py-2.5 px-3.5">
                <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                <span className="text-[13px] text-slate-600 dark:text-slate-400">
                  Appointment: {apptText}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg py-2.5 px-3.5">
              <Phone size={14} className="text-blue-500 flex-shrink-0" />
              <span className="text-[13px] text-slate-600 dark:text-slate-400">
                Provider will call you within 2 hours.
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onViewBookings}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,.25)" }}
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookAppointment = () => {
  const { id: quoteId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  // Detect reschedule mode: URL is /dashboard/bookings/:id/reschedule
  const isReschedule = location.pathname.includes("/bookings/") && location.pathname.endsWith("/reschedule");
  const bookingIdFromUrl = isReschedule ? quoteId : null; // quoteId param captures the :id

  const { quotes, fetchQuoteDetails, fetchQuotes, fetchBookings, addToast } = useDashboardStore();

  // ── Local state ──
  const [quote, setQuote] = useState(null);
  const [booking, setBooking] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const paymentVerifiedRef = useRef(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availabilityCache, setAvailabilityCache] = useState({});
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [currentSlots, setCurrentSlots] = useState([]);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState("");

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  // ── Load quote on mount (skip in reschedule mode) ──
  useEffect(() => {
    if (isReschedule) return;
    const load = async () => {
      setIsLoadingQuote(true);
      let q = quotes.find((item) => item.id === quoteId);
      if (!q) {
        q = await fetchQuoteDetails(quoteId);
      }
      if (!q) {
        addToast({ type: "error", message: "Quote not found." });
        navigate("/dashboard/quotes", { replace: true });
        return;
      }
      setQuote(q);

      // Resolve booking: quote.booking may be an object or ID string
      const bookingData = q.booking || null;
      if (bookingData && typeof bookingData === "object") {
        setBooking(bookingData);
      }
      setIsLoadingQuote(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  // ── Load booking directly for reschedule mode ──
  useEffect(() => {
    if (!isReschedule || !bookingIdFromUrl) return;
    const loadBooking = async () => {
      setIsLoadingQuote(true);
      try {
        const res = await bookingService.getBooking(bookingIdFromUrl);
        if (res.success && res.data) {
          const b = res.data;
          setBooking(b);
          // Build a minimal quote-like object for display fields
          setQuote({
            id: b.quote?._id || b.quote || bookingIdFromUrl,
            vehicleFormatted: b.vehicle?.year
              ? `${b.vehicle?.make || ""} ${b.vehicle?.model || ""} - ${b.vehicle.year}`
              : `${b.vehicle?.make || ""} ${b.vehicle?.model || ""}`.trim(),
            vehicle: { registrationNumber: b.vehicle?.registrationNumber || "" },
            serviceSelections: b.serviceSelections,
            serviceType: b.service,
            location: b.serviceAddress || b.location,
            booking: b,
            responses: [],
          });
        } else {
          addToast({ type: "error", message: "Booking not found." });
          navigate("/dashboard/bookings", { replace: true });
        }
      } catch (err) {
        addToast({ type: "error", message: "Failed to load booking." });
        navigate("/dashboard/bookings", { replace: true });
      } finally {
        setIsLoadingQuote(false);
      }
    };
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingIdFromUrl, isReschedule]);

  // ── Verify Paystack payment if ?reference= is present ──
  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference || paymentVerifiedRef.current) return;
    paymentVerifiedRef.current = true;

    const verify = async () => {
      setIsVerifyingPayment(true);
      try {
        const res = await paymentService.verifyPaystack(reference);
        if (res.success) {
          // Show payment success modal
          setPaymentReference(reference);
          setShowPaymentSuccess(true);
          // Re-fetch quote to get updated booking data
          const updated = await fetchQuoteDetails(quoteId);
          if (updated) {
            setQuote(updated);
            const bookingData = updated.booking || null;
            if (bookingData && typeof bookingData === "object") {
              setBooking(bookingData);
            }
          }
        } else {
          addToast({ type: "error", message: res.message || "Payment verification failed." });
        }
      } catch (err) {
        import.meta.env.DEV && console.error("Payment verify error:", err);
        addToast({ type: "error", message: "Could not verify payment. Please contact support." });
      } finally {
        setIsVerifyingPayment(false);
        // Clean the URL (remove reference params)
        searchParams.delete("reference");
        searchParams.delete("trxref");
        setSearchParams(searchParams, { replace: true });
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Derive provider ID ──
  const providerId = (() => {
    // From accepted response
    if (quote?.responses?.length) {
      const accepted = quote.responses.find(
        (r) =>
          r.status === "accepted" ||
          r.status === "Accepted" ||
          r._id === quote.acceptedResponseId
      );
      if (accepted) {
        const p = accepted.provider;
        return typeof p === "string" ? p : p?._id || p?.id || null;
      }
    }
    // From booking
    if (booking?.provider) {
      const p = booking.provider;
      return typeof p === "string" ? p : p?._id || p?.id || null;
    }
    if (booking?.providerId) return booking.providerId;
    return null;
  })();

  // ── Derive provider name ──
  const providerName = (() => {
    if (booking?.provider?.businessName) return booking.provider.businessName;
    if (booking?.provider?.name) return booking.provider.name;
    if (booking?.providerName) return booking.providerName;
    if (quote?.responses?.length) {
      const accepted = quote.responses.find(
        (r) => r.status === "accepted" || r.status === "Accepted"
      );
      if (accepted?.provider?.businessName) return accepted.provider.businessName;
      if (accepted?.provider?.name) return accepted.provider.name;
    }
    return "Provider";
  })();

  // ── Derive provider avatar URL ──
  const providerAvatarUrl = (() => {
    const sources = [
      booking?.provider,
      quote?.responses?.find((r) => r.status === "accepted" || r.status === "Accepted")?.provider,
    ];
    for (const src of sources) {
      const raw = src?.avatarUrl || src?.personalImageUrl || src?.companyLogoUrl || src?.profileImage;
      if (raw) {
        return raw.startsWith("http") || raw.startsWith("data:") ? raw : `${NodeURL}${raw}`;
      }
    }
    return null;
  })();

  // ── Derive display fields ──
  const vehicleStr = quote?.vehicleFormatted || (typeof quote?.vehicle === "string" ? quote.vehicle : "") || "";

  // Build service lines — supports multi-service (serviceSelections) and legacy single
  const serviceLines = (() => {
    const src = quote || booking || {};
    if (src.serviceSelections?.length > 0) {
      return src.serviceSelections.map((sel) => {
        const name = sel.serviceName || sel.serviceType || "";
        const glass = Array.isArray(sel.glassTypes) ? sel.glassTypes.join(", ") : "";
        return glass ? `${name} · ${glass}` : name;
      });
    }
    if (booking?.service) return [booking.service];
    if (quote?.serviceType) return [quote.serviceType];
    return ["Auto Glass Service"];
  })();
  const serviceStr = serviceLines[0] || "Auto Glass Service";
  const locationStr = (() => {
    const src = booking || quote || {};
    const isMobile =
      src.serviceLocationType !== "shop" && src.serviceLocationType !== "workshop";

    let address = "";
    if (booking?.address) {
      address = booking.address;
    } else if (quote?.location) {
      const loc = quote.location;
      if (typeof loc === "string") {
        address = loc;
      } else {
        address = [loc.addressLine1, loc.suburb, loc.city].filter(Boolean).join(", ");
      }
    }

    return isMobile && address ? `Mobile — ${address}` : address;
  })();
  const totalAmount = booking?.price?.total || booking?.totalAmount || 0;

  // Get registration number from quote vehicle raw data
  const regNumber = quote?.vehicle?.registrationNumber || "";

  // Duration-aware slot selection
  const estimatedDuration = booking?.estimatedDuration || 60;
  const slotsNeeded = Math.ceil(estimatedDuration / 30);

  // Derive service types + glass types for staff-aware availability (business providers)
  const bookingServiceTypes = (() => {
    const src = booking || quote || {};
    if (src.serviceTypes?.length > 0) return src.serviceTypes;
    if (src.serviceSelections?.length > 0) {
      return src.serviceSelections
        .map((s) => s.serviceType)
        .filter(Boolean);
    }
    if (src.serviceType) return [src.serviceType];
    return [];
  })();
  const bookingGlassTypes = (() => {
    const src = booking || quote || {};
    if (src.glassTypes?.length > 0) return src.glassTypes;
    if (src.serviceSelections?.length > 0) {
      return [...new Set(
        src.serviceSelections.flatMap((s) => s.glassTypes || [])
      )];
    }
    if (src.glassType) return [src.glassType];
    return [];
  })();

  // Derive customer coordinates for distance-based travel buffer
  const custCoords = (() => {
    const src = booking || quote || {};
    // booking.serviceAddress.coordinates or quote.location.coordinates
    const c = src.serviceAddress?.coordinates || src.location?.coordinates;
    return c?.lat && c?.lng ? c : null;
  })();

  // ── Fetch availability on date change ──
  const fetchSlotsForDate = useCallback(
    async (dateStr) => {
      if (!providerId) return;
      if (availabilityCache[dateStr]) {
        setCurrentSlots(availabilityCache[dateStr].slots || []);
        return;
      }
      setIsFetchingSlots(true);
      try {
        const result = await quoteService.getProviderAvailability(providerId, dateStr, bookingServiceTypes, bookingGlassTypes, custCoords?.lat, custCoords?.lng);
        if (result.success && result.data) {
          const slots = result.data.slots || [];
          setAvailabilityCache((prev) => ({ ...prev, [dateStr]: { slots } }));
          setCurrentSlots(slots);
        } else {
          setCurrentSlots([]);
          setAvailabilityCache((prev) => ({ ...prev, [dateStr]: { slots: [] } }));
        }
      } catch {
        setCurrentSlots([]);
      } finally {
        setIsFetchingSlots(false);
      }
    },
    [providerId, availabilityCache, bookingServiceTypes, bookingGlassTypes, custCoords]
  );

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot("");
    fetchSlotsForDate(dateStr);
  };

  // ── Prefetch availability for a given month's future dates ──
  const prefetchedMonthsRef = useRef(new Set());

  const prefetchMonth = useCallback(
    async (year, month) => {
      if (!providerId) return;
      const key = `${year}-${month}`;
      if (prefetchedMonthsRef.current.has(key)) return;
      prefetchedMonthsRef.current.add(key);

      setIsPrefetching(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
          if (dateObj <= today) continue; // skip past & today
          const dateStr = formatLocalDate(dateObj);
          if (availabilityCache[dateStr]) continue; // already cached
          try {
            const result = await quoteService.getProviderAvailability(providerId, dateStr, bookingServiceTypes, bookingGlassTypes, custCoords?.lat, custCoords?.lng);
            if (result.success && result.data) {
              const slots = result.data.slots || [];
              setAvailabilityCache((prev) => ({ ...prev, [dateStr]: { slots } }));
            } else {
              setAvailabilityCache((prev) => ({ ...prev, [dateStr]: { slots: [] } }));
            }
          } catch {
            setAvailabilityCache((prev) => ({ ...prev, [dateStr]: { slots: [] } }));
          }
          // Small delay to avoid hammering the API
          await new Promise((r) => setTimeout(r, 80));
        }
      } finally {
        setIsPrefetching(false);
      }
    },
    [providerId, availabilityCache, bookingServiceTypes, bookingGlassTypes],
  );

  // Prefetch current month on mount
  useEffect(() => {
    if (!providerId) return;
    const today = new Date();
    prefetchMonth(today.getFullYear(), today.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  // Called when user navigates to a new month
  const handleMonthChange = useCallback(
    (year, month) => {
      prefetchMonth(year, month);
    },
    [prefetchMonth],
  );

  // ── Confirm appointment ──
  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;

    // Find booking ID — in reschedule mode use the URL param directly
    const bookingId =
      bookingIdFromUrl ||
      (booking?._id || booking?.id) ||
      (quote?.booking?._id || quote?.booking?.id || quote?.bookingId);

    if (!bookingId) {
      addToast({
        type: "error",
        message: "Unable to find your booking. Please contact support.",
      });
      return;
    }

    setIsConfirming(true);
    try {
      const result = await bookingService.rescheduleBooking(bookingId, {
        scheduledDate: selectedDate,
        scheduledTimeSlot: selectedSlot,
      });

      if (result.success) {
        const ref =
          result.data?.bookingNumber ||
          result.data?.reference ||
          booking?.reference ||
          booking?.bookingNumber ||
          "";
        setConfirmedBookingRef(ref);
        setIsConfirmed(true);

        // Refresh stores so Bookings page shows updated data
        fetchBookings?.().catch(() => {});
        fetchQuotes?.().catch(() => {});
      } else {
        addToast({
          type: "error",
          message: result.message || "Failed to confirm appointment. Please try again.",
        });
      }
    } catch (err) {
      addToast({
        type: "error",
        message:
          err?.response?.data?.error ||
          "An error occurred while confirming your appointment.",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Loading state ──
  if (isLoadingQuote || isVerifyingPayment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        {isVerifyingPayment && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Verifying your payment...</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <button
        onClick={() => navigate(isReschedule ? "/dashboard/bookings" : "/dashboard/quotes")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-5 self-start"
      >
        <ArrowLeft size={16} />
        {isReschedule ? "Back to Bookings" : "Back to Quotes"}
      </button>

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isReschedule ? "Reschedule Appointment" : "Book Your Appointment"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isReschedule
            ? "Choose a new date and time for your appointment."
            : "Your payment is confirmed — choose a date and time that suits you."}
        </p>
      </div>

      {/* Journey progress — hidden in reschedule mode */}
      {!isReschedule && <JourneyProgress />}

      {/* Provider paid bar — hidden in reschedule mode */}
      {!isReschedule && (
        <ProviderPaidBar
          providerName={providerName}
          service={serviceStr}
          vehicle={vehicleStr}
          amount={totalAmount}
          avatarUrl={providerAvatarUrl}
        />
      )}

      {/* Provider ID warning */}
      {!providerId && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Provider availability could not be loaded. Please contact support if this persists.
          </p>
        </div>
      )}

      {/* Calendar + Slots grid (2-col: calendar left, slots+summary right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left column — Calendar */}
        <div>
          <CalendarPicker
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availabilityCache={availabilityCache}
            onMonthChange={handleMonthChange}
            isPrefetching={isPrefetching}
          />
        </div>

        {/* Right column — Time Slots + Appointment Summary */}
        <div>
          <TimeSlotsPanel
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
            slots={currentSlots}
            isLoading={isFetchingSlots}
            slotsNeeded={slotsNeeded}
            estimatedDuration={estimatedDuration}
          />

          {/* Appointment summary — appears below slots when both date and slot are selected */}
          {selectedDate && selectedSlot && (
            <AppointmentSummary
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              providerName={providerName}
              serviceLines={serviceLines}
              vehicle={vehicleStr}
              registrationNumber={regNumber}
              location={locationStr}
              onConfirm={handleConfirm}
              isConfirming={isConfirming}
              estimatedDuration={estimatedDuration}
              slotsNeeded={slotsNeeded}
              isReschedule={isReschedule}
            />
          )}
        </div>
      </div>

      {/* Payment Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
              {/* Green checkmark */}
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5">
                <Check size={32} className="text-emerald-600" strokeWidth={3} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Your payment has been processed securely. Now choose your appointment time.
              </p>

              {/* Payment reference */}
              <div className="mb-6">
                <p className="text-[.625rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Payment Reference
                </p>
                <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
                  {paymentReference}
                </p>
              </div>

              <button
                onClick={() => setShowPaymentSuccess(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md hover:-translate-y-px"
                style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
              >
                Book Your Appointment
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed modal */}
      <ConfirmedModal
        isOpen={isConfirmed}
        bookingReference={confirmedBookingRef}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onViewBookings={() => navigate("/dashboard/bookings")}
        slotsNeeded={slotsNeeded}
        isReschedule={isReschedule}
      />
    </div>
  );
};

export default BookAppointment;
