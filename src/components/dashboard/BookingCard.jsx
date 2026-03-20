import {
  Check,
  CalendarCheck,
  ArrowRight,
  Star,
  Download,
  XCircle,
  RefreshCw,
  CheckCircle,
  Phone,
  Navigation,
} from "lucide-react";
import { formatCurrency } from "../../store/useDashboardStore";
import StatusBadge from "../ui/StatusBadge";

// "Tue 14 Jan" format matching reference HTML
const formatDateShort = (dateString) => {
  if (!dateString) return "-";
  let date;
  if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return "-";
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday} ${day} ${month}`;
};

const getCategory = (booking) => {
  const s = booking.status?.toLowerCase();
  if (["cancelled", "rejected", "expired"].includes(s)) return "cancelled";
  if (s === "completed" || s === "completed-by-fitter") return "completed";
  return "upcoming";
};

const BookingCard = ({
  booking,
  onClick,
  onBookAppointment,
  onCancel,
  onInvoice,
  onRate,
  onReschedule,
  onAcknowledge,
  onDirections,
}) => {
  const category = getCategory(booking);
  const isPaid = booking.paymentStatus?.toLowerCase() === "paid";
  const hasSchedule = !!booking.scheduledDate;
  const isCompletedByFitter = booking.status?.toLowerCase() === "completed-by-fitter";
  const isCompleted = booking.status?.toLowerCase() === "completed";
  const isScheduled = booking.status?.toLowerCase() === "confirmed" && hasSchedule && isPaid;

  const quoteId =
    booking.quote?._id ||
    (typeof booking.quote === "string" ? booking.quote : null) ||
    booking.quoteId ||
    booking.quoteRequestId;

  const needsAppointment = category === "upcoming" && isPaid && !hasSchedule && quoteId;
  const canReschedule = isScheduled && category === "upcoming" && new Date(booking.scheduledDate) - new Date() > 24 * 3600000;
  const isWorkshop = booking.serviceLocationType === "workshop" || booking.locationType === "In-Store";
  const hasWorkshopAddress = !!booking.workshopAddress?.addressLine1;
  const canGetDirections = isWorkshop && hasWorkshopAddress && category === "upcoming" && isPaid;

  // Format time slot with duration-aware end time (only for new single-point slots like "09:00")
  const timeSlotStr = (() => {
    const ts = booking.scheduledTimeSlot;
    if (!ts) return null;
    if (typeof ts === "object" && ts.start) {
      if (ts.start === "00:00" && (!ts.end || ts.end === "00:00")) return null;
      return `${ts.start}${ts.end ? ` – ${ts.end}` : ""}`;
    }
    if (typeof ts !== "string") return null;
    if (ts === "00:00" || ts === "00:00 - 00:00") return null;
    // Old bookings have range format like "10:00 - 12:00" — return as-is
    if (ts.includes("-") || ts.includes("–")) return ts;
    // New bookings: single time point with estimatedDuration
    const dur = booking.estimatedDuration;
    if (dur && dur > 30) {
      const slotsNeeded = Math.ceil(dur / 30);
      const [h, m] = ts.split(":").map(Number);
      const endMins = (h || 0) * 60 + (m || 0) + slotsNeeded * 30;
      const endH = String(Math.floor(endMins / 60)).padStart(2, "0");
      const endM = String(endMins % 60).padStart(2, "0");
      return `${ts} – ${endH}:${endM}`;
    }
    return ts;
  })();

  // Service display
  const serviceDisplay = (() => {
    if (booking.serviceSelections?.length > 0) {
      return booking.serviceSelections.map((s) => s.serviceName).join(", ");
    }
    return booking.service || "Auto Glass Service";
  })();

  // Location
  const locationParts = (() => {
    const addr = booking.address || "";
    if (!addr || addr === "Location not specified") return { line1: "—", sub: "" };
    const parts = addr.split(",").map((p) => p.trim());
    return { line1: parts[0] || "—", sub: parts.slice(1).join(", ") };
  })();

  // Header gradient — green for scheduled, matching reference HTML
  const headerStyle = (() => {
    if (category === "completed")
      return { background: "linear-gradient(135deg, #475569, #1e293b)" };
    if (category === "cancelled")
      return { background: "linear-gradient(135deg, #94a3b8, #64748b)" };
    if (isScheduled)
      return { background: "linear-gradient(135deg, #15803D, #166534)" };
    // Upcoming — blue default
    return { background: "linear-gradient(135deg, var(--color-primary-700, #1d4ed8), var(--color-primary-900, #1e3a8a))" };
  })();

  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer bg-white dark:bg-slate-900"
      onClick={onClick}
    >
      {/* ── Header ── */}
      <div
        className="px-5 py-4 sm:px-6 flex justify-between items-start"
        style={headerStyle}
      >
        <div className="min-w-0 flex-1">
          <div className="font-display text-[1.0625rem] font-bold text-white leading-snug">
            {serviceDisplay}
          </div>
          <div className="text-[.8125rem] text-white/70 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{booking.vehicle}</span>
            {booking.vehicleRegNumber && (
              <>
                <span className="text-white/40">·</span>
                <span className="font-mono text-xs text-white/50">{booking.vehicleRegNumber}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
          {isScheduled ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-[3px] text-xs font-semibold rounded-full"
              style={booking.rescheduledAt
                ? { background: "rgba(251,191,36,.2)", color: "#fbbf24" }
                : { background: "rgba(255,255,255,.15)", color: "#fff" }
              }
            >
              {booking.rescheduledAt && <RefreshCw size={11} />}
              {booking.rescheduledAt ? "Rescheduled" : "Scheduled"}
            </span>
          ) : (
            <StatusBadge
              status={
                isCompletedByFitter
                  ? "completed-by-fitter"
                  : booking.status?.toLowerCase() === "searching" && booking.quotes?.length > 0
                    ? "awaiting-customer-approval"
                    : booking.status
              }
              type="booking"
            />
          )}
          <span className="font-mono text-[.6875rem] text-white/50">{booking.reference}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
        {/* Date & Time */}
        <div className="flex-1 min-w-[110px]">
          <div className="text-[.625rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Date & Time
          </div>
          {hasSchedule ? (
            <>
              <div className="text-[.875rem] font-semibold text-slate-800 dark:text-white">
                {formatDateShort(booking.scheduledDate)}
              </div>
              {timeSlotStr && (
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeSlotStr}</div>
              )}
            </>
          ) : (
            <div className="text-[.875rem] font-semibold text-amber-600 dark:text-amber-400">
              Not Scheduled
            </div>
          )}
        </div>

        {/* Provider */}
        <div className="flex-1 min-w-[110px]">
          <div className="text-[.625rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Provider
          </div>
          <div className="text-[.875rem] font-semibold text-slate-800 dark:text-white truncate">
            {booking.providerName}
          </div>
          {isPaid && hasSchedule && booking.providerPhone ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone size={10} className="text-slate-400" />
              <span className="text-xs text-slate-400">{booking.providerPhone}</span>
            </div>
          ) : booking.providerRating > 0 ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-400">{booking.providerRating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        {/* Service Type */}
        <div className="flex-1 min-w-[110px]">
          <div className="text-[.625rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Service Type
          </div>
          <div className="text-[.875rem] font-semibold text-slate-800 dark:text-white">
            {booking.locationType || "Mobile"}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {booking.locationType === "In-Store" ? "Drop vehicle off" : "Comes to you"}
          </div>
        </div>

        {/* Location */}
        <div className="flex-1 min-w-[110px]">
          <div className="text-[.625rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Location
          </div>
          <div className="text-[.875rem] font-semibold text-slate-800 dark:text-white truncate">
            {locationParts.line1}
          </div>
          {locationParts.sub && (
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{locationParts.sub}</div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 sm:px-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[1.125rem] font-extrabold text-slate-900 dark:text-white">
            {(() => {
              const num = +(booking.price?.total) || 0;
              const hasDecimals = num % 1 !== 0;
              return `R ${num.toLocaleString("en-US", { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2, useGrouping: false })}`;
            })()}
          </span>
          {isPaid && (
            <span className="text-xs font-normal text-slate-400">Paid</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
          {/* Book Appointment — paid but no schedule */}
          {needsAppointment && (
            <button
              onClick={() => onBookAppointment?.(booking)}
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              <CalendarCheck size={13} />
              Book Appointment
              <ArrowRight size={12} />
            </button>
          )}

          {/* Reschedule — scheduled booking >24h away */}
          {canReschedule && onReschedule && (
            <button
              onClick={() => onReschedule(booking)}
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              <RefreshCw size={13} />
              Reschedule
            </button>
          )}

          {/* Directions — workshop bookings with provider workshop address */}
          {canGetDirections && onDirections && (
            <button
              onClick={() => onDirections(booking)}
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <Navigation size={12} />
              Directions
            </button>
          )}

          {/* Upcoming — Cancel */}
          {category === "upcoming" && !isCompletedByFitter && onCancel && (
            <button
              onClick={() => onCancel(booking)}
              className="inline-flex items-center justify-center gap-1 w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              style={{ color: "#DC2626" }}
            >
              Cancel
            </button>
          )}

          {/* Completed-by-fitter — Acknowledge opens modal */}
          {isCompletedByFitter && (
            <button
              onClick={() => onAcknowledge?.(booking)}
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md"
              style={{ background: "linear-gradient(135deg, #16A34A, #15803D)" }}
            >
              <CheckCircle size={13} />
              Acknowledge
            </button>
          )}

          {/* Completed — Invoice + Rate */}
          {isCompleted && (
            <>
              {onInvoice && (
                <button
                  onClick={() => onInvoice(booking)}
                  className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download size={12} />
                  Invoice
                </button>
              )}
              {onRate && !booking.rating?.score && (
                <button
                  onClick={() => onRate(booking)}
                  className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md hover:-translate-y-px"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                >
                  <Star size={12} />
                  Rate
                </button>
              )}
            </>
          )}

          {/* Cancelled */}
          {category === "cancelled" && (
            <button
              onClick={() => onClick?.()}
              className="inline-flex items-center justify-center gap-1 w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
