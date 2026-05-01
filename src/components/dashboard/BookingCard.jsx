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
  Shield,
  ShieldCheck,
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
  const pStatus = booking.paymentStatus?.toLowerCase();
  // Partial Payment (Points 1-2, April 2026): "deposit_paid" is treated as
  // committed — booking is confirmed even though balance is still owed.
  // Note: dataMappers.getNormalizedPaymentStatus() normalises the raw enum
  // "deposit_paid" → "Deposit Paid" (with space). We must accept BOTH the
  // raw enum (underscore) and the normalised label (lowercased space) so
  // this check works regardless of upstream mapping. Also accept
  // partialPayment.isActive as an authoritative fallback.
  const isDepositPaid =
    pStatus === "deposit_paid" ||
    pStatus === "deposit paid" ||
    (booking.partialPayment?.isActive === true &&
      booking.balanceStatus === "pending" &&
      Number(booking.depositAmount) > 0);
  const isPaid = pStatus === "paid" || pStatus === "insurance_direct" || isDepositPaid;
  const hasBalanceDue =
    booking.partialPayment?.isActive === true &&
    booking.balanceStatus === "pending" &&
    Number(booking.balanceAmount) > 0;
  const hasSchedule = !!booking.scheduledDate;
  const isCompletedByFitter = booking.status?.toLowerCase() === "completed-by-fitter";
  const isCompleted = booking.status?.toLowerCase() === "completed";
  // Flexible Payment Options v1.2 — cash bookings are "confirmed" without prepayment
  const isCashBooking = booking.paymentOption === "cash";
  const isCardAfterBooking = booking.paymentOption === "card_on_completion";
  const cashConfirmed =
    isCashBooking && booking.status?.toLowerCase() === "confirmed";
  const cardAfterConfirmed =
    isCardAfterBooking && booking.status?.toLowerCase() === "confirmed";
  // Card-after Path B: status flips to "payment-pending" once provider marks Service Done
  const isPaymentPending =
    isCardAfterBooking && booking.status?.toLowerCase() === "payment-pending";
  // Tokenize abandoned: booking exists in "confirmed" state but the Paystack
  // tokenize redirect was never completed (legacy orphans from before the
  // deferred-acceptance refactor). Treat as NOT committed — customer still
  // needs to complete card setup.
  const isTokenizeAbandoned =
    cardAfterConfirmed &&
    booking.paymentSubMethod === "tokenized" &&
    !booking.cardAuth?.authorizationCode;
  // Single source of truth: "committed" means the customer has made their
  // payment arrangement, whether or not money has actually been collected.
  // Covers: prepayment/insurance paid, cash-on-completion confirmed, card-
  // after with a valid payment arrangement (payment_link or tokenized+card
  // on file). Excludes tokenize-abandoned bookings.
  const isCommitted =
    isPaid || cashConfirmed || (cardAfterConfirmed && !isTokenizeAbandoned);
  const isScheduled = category === "upcoming" && isCommitted && hasSchedule;

  const quoteId =
    booking.quote?._id ||
    (typeof booking.quote === "string" ? booking.quote : null) ||
    booking.quoteId ||
    booking.quoteRequestId;

  const needsAppointment =
    category === "upcoming" && isCommitted && !hasSchedule && quoteId;
  const canReschedule = isScheduled && category === "upcoming" && new Date(booking.scheduledDate) - new Date() > 24 * 3600000;
  const isWorkshop = booking.serviceLocationType === "workshop" || booking.locationType === "Workshop";
  const hasWorkshopAddress = !!booking.workshopAddress?.addressLine1;
  const canGetDirections =
    isWorkshop && hasWorkshopAddress && category === "upcoming" && isCommitted;

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
    // New bookings: use bookedDuration (includes buffer) if available, else compute
    const dur = booking.estimatedDuration;
    const totalMin = booking.bookedDuration
      || (dur ? Math.ceil(dur / 30) * 30 + (isWorkshop ? 30 : 0) : 0);
    if (totalMin && totalMin > 30) {
      const [h, m] = ts.split(":").map(Number);
      const endMins = (h || 0) * 60 + (m || 0) + totalMin;
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

  // Location — show workshop address for workshop bookings, customer address for mobile
  const locationParts = (() => {
    if (isWorkshop && booking.workshopAddress?.addressLine1) {
      const ws = booking.workshopAddress;
      const line1 = ws.addressLine1;
      const sub = [ws.suburb, ws.city, ws.province].filter(Boolean).join(", ");
      return { line1, sub };
    }
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
            {booking.isInsuranceClaim && (
              <>
                <span className="text-white/40">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/80 bg-white/15 px-1.5 py-px rounded">
                  <Shield size={9} />
                  Insurance
                </span>
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
          {booking.assignedStaffName && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Technician: <span className="font-semibold text-slate-700 dark:text-slate-300">{booking.assignedStaffName}</span>
            </div>
          )}
          {booking.assignedStaffName && booking.assignedStaffPhone && isCommitted ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone size={10} className="text-slate-400" />
              <span className="text-xs text-slate-400">{booking.assignedStaffPhone}</span>
            </div>
          ) : isCommitted && hasSchedule && booking.providerPhone ? (
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
          {((booking.providerBusinessType !== "individual" && booking.providerVatNumber) ||
            (booking.isInsuranceClaim && booking.providerInsuranceApproved)) && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {booking.providerBusinessType !== "individual" && booking.providerVatNumber && (
                <span className="text-[0.5625rem] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-px rounded-full dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 flex-shrink-0">
                  VAT Registered
                </span>
              )}
              {booking.isInsuranceClaim && booking.providerInsuranceApproved && (
                <span className="text-[0.5625rem] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-px rounded-full dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 flex-shrink-0 inline-flex items-center gap-0.5">
                  <ShieldCheck size={8} />
                  Insurance Approved
                </span>
              )}
            </div>
          )}
        </div>

        {/* Service Type */}
        <div className="flex-1 min-w-[110px]">
          <div className="text-[.625rem] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Service Mode
          </div>
          <div className="text-[.875rem] font-semibold text-slate-800 dark:text-white">
            {booking.locationType || "Mobile"}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {booking.locationType === "Workshop" ? "Drop vehicle off" : "Comes to you"}
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
              const isInsR0 = booking.isInsuranceClaim && booking.insuranceDetails?.isRegisteredProvider && (+(booking.price?.total) || 0) === 0;
              const num = isInsR0 ? (+(booking.insuranceDetails?.totalJobValue) || 0) : (+(booking.price?.total) || 0);
              const hasDecimals = num % 1 !== 0;
              return `R ${num.toLocaleString("en-US", { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2, useGrouping: false })}`;
            })()}
          </span>
          {isPaid && !hasBalanceDue && (
            <span className="text-xs font-normal text-slate-400">
              {booking.isInsuranceClaim && booking.insuranceDetails?.isRegisteredProvider
                ? ((+(booking.price?.total) || 0) === 0 ? "Insurance Covered" : "Excess Paid")
                : "Paid"}
            </span>
          )}
          {/* Partial Payment — deposit paid, balance still due (Points 1-2, April 2026) */}
          {hasBalanceDue && (
            <span
              className="inline-flex items-center gap-1 text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
              title={`Deposit R${booking.depositAmount} paid · Balance R${booking.balanceAmount} due at completion`}
            >
              Deposit Paid · Balance R{(+(booking.balanceAmount) || 0).toLocaleString("en-US")} due
            </span>
          )}
          {/* Cash on Completion indicator (Flexible Payment Options v1.2) */}
          {isCashBooking && !isPaid && (
            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
              Cash on Completion
            </span>
          )}
          {/* Card on Completion (Path B) — pre-service */}
          {cardAfterConfirmed && !isPaymentPending && !booking.cardAuth?.last4 && (
            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
              Pay After Service
            </span>
          )}
          {/* Card on Completion (Path A, tokenized) — card saved, will auto-charge */}
          {cardAfterConfirmed && !isPaymentPending && booking.cardAuth?.last4 && (
            <span
              className="inline-flex items-center gap-1 text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800"
              title={`${booking.cardAuth.cardType || "Card"} ending ${booking.cardAuth.last4}`}
            >
              Card ••••{booking.cardAuth.last4}
            </span>
          )}
          {/* Card on Completion (Path B) — payment pending after service-done */}
          {isPaymentPending && (
            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 animate-pulse">
              Payment Required
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
          {/* Pay Now — Card on Completion Path B after service-done */}
          {isPaymentPending && booking.paymentLink?.url && (
            <a
              href={booking.paymentLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-md hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)" }}
            >
              Pay Now
              <ArrowRight size={12} />
            </a>
          )}

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
