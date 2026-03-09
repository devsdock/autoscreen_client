import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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

// ─── Journey Progress Bar ────────────────────────────────────────────────────

const STEPS = [
  { label: "Sent" },
  { label: "Providers" },
  { label: "Reviewed" },
  { label: "Paid" },
  { label: "Book Appt" },
  { label: "Confirmed" },
];

const JourneyProgress = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
    <div className="flex items-center justify-between relative">
      {/* Connecting line */}
      <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 dark:bg-slate-700 z-0" />
      <div
        className="absolute left-0 top-4 h-0.5 bg-blue-600 z-0 transition-all duration-500"
        style={{ width: "calc(80% - 0px)" }}
      />

      {STEPS.map((step, idx) => {
        const isDone = idx < 4;
        const isActive = idx === 4;
        const isPending = idx === 5;

        return (
          <div
            key={step.label}
            className="flex flex-col items-center gap-1.5 z-10 flex-1"
          >
            <div
              className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                isDone
                  ? "bg-blue-600 text-white"
                  : isActive
                    ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500",
              ].join(" ")}
            >
              {isDone ? <Check size={14} /> : idx + 1}
            </div>
            <span
              className={[
                "text-[10px] font-medium text-center leading-tight",
                isDone || isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500",
              ].join(" ")}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Provider Paid Bar ───────────────────────────────────────────────────────

const ProviderPaidBar = ({ providerName, service, vehicle, amount }) => {
  const initials = (providerName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6 flex items-center gap-4 flex-wrap">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {initials}
      </div>

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

const CalendarPicker = ({ selectedDate, onDateSelect, availabilityCache, onMonthChange }) => {
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

      <div className="p-4 pt-3">
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

const TimeSlotsPanel = ({ selectedDate, selectedSlot, onSlotSelect, slots, isLoading }) => {
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-md">
      <h3
        className="font-bold text-[15px] text-slate-900 dark:text-slate-100 mb-4"
        style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
      >
        {dateLongNoYear} — Available Times
      </h3>

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
            const isSelected = selectedSlot === slot;
            return (
              <button
                key={slot}
                onClick={() => onSlotSelect(slot)}
                className={[
                  "px-2 py-2.5 rounded-lg border-[1.5px] text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                ].join(" ")}
              >
                <div className="text-sm font-semibold">{slot}</div>
                <div className={[
                  "text-[10px] mt-0.5 opacity-70",
                  isSelected ? "text-white/70" : "",
                ].join(" ")}>
                  Available
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
}) => {
  const rows = [
    { label: "Date", value: formatDateLong(selectedDate) },
    { label: "Time", value: selectedSlot },
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
        {isConfirming ? "Confirming..." : "Confirm Appointment"}
      </button>
    </div>
  );
};

// ─── Confirmed Modal ──────────────────────────────────────────────────────────

const ConfirmedModal = ({ isOpen, bookingReference, selectedDate, selectedSlot, onViewBookings }) => {
  if (!isOpen) return null;

  // "Thursday 9 Jan, 09:00" format
  const apptText = (() => {
    if (!selectedDate || !selectedSlot) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return "";
    const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-GB", { month: "short" });
    return `${weekday} ${day} ${month}, ${selectedSlot}`;
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
            You&apos;re all booked!
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Your appointment is confirmed. The provider will contact you to confirm the exact arrival window.
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
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [currentSlots, setCurrentSlots] = useState([]);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState("");

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  // ── Load quote on mount ──
  useEffect(() => {
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

  // ── Derive display fields ──
  const vehicleStr = quote?.vehicleFormatted || quote?.vehicle || "";

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
        const result = await quoteService.getProviderAvailability(providerId, dateStr);
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
    [providerId, availabilityCache]
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        if (dateObj <= today) continue; // skip past & today
        const dateStr = formatLocalDate(dateObj);
        if (availabilityCache[dateStr]) continue; // already cached
        try {
          const result = await quoteService.getProviderAvailability(providerId, dateStr);
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
    },
    [providerId, availabilityCache],
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

    // Find booking ID
    const bookingId =
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
        onClick={() => navigate("/dashboard/quotes")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-5 self-start"
      >
        <ArrowLeft size={16} />
        Back to Quotes
      </button>

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Book Your Appointment
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your payment is confirmed — choose a date and time that suits you.
        </p>
      </div>

      {/* Journey progress */}
      <JourneyProgress />

      {/* Provider paid bar */}
      <ProviderPaidBar
        providerName={providerName}
        service={serviceStr}
        vehicle={vehicleStr}
        amount={totalAmount}
      />

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
      />
    </div>
  );
};

export default BookAppointment;
