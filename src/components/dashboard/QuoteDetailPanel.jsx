import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Wrench,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  Check,
  ArrowRight,
  CreditCard,
  CalendarCheck,
  SlidersHorizontal,
  Star,
  Phone,
} from "lucide-react";
import useDashboardStore, {
  formatDate,
  formatCurrency,
} from "../../store/useDashboardStore";
import { NodeURL } from "../../services/api";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";
import ProviderResponseCard from "./ProviderResponseCard";
import Modal from "../ui/Modal";
import PaymentModal from "./PaymentModal";

const QuoteDetailPanel = ({ quote, onClose }) => {
  const navigate = useNavigate();
  const {
    user,
    quoteResponses,
    closeQuoteRequest,
    addToast,
    fetchQuoteDetails,
  } = useDashboardStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [closeModal, setCloseModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [sortFilter, setSortFilter] = useState("best-price");

  // Fetch latest details to ensure we have responses
  useEffect(() => {
    if (quote?.id) {
      fetchQuoteDetails(quote.id);
    }
  }, [quote?.id, fetchQuoteDetails]);


  if (!quote) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <FileText
            size={48}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
          />
          <p className="text-slate-500 dark:text-slate-400">
            Select a quote to view details
          </p>
        </div>
      </div>
    );
  }

  const responses = quoteResponses.filter((r) => r.quoteRequestId === quote.id);
  const isAccepted =
    quote.status === "Accepted" ||
    quote.status?.toLowerCase() === "accepted" ||
    !!quote.booking;
  const isClosed =
    quote.status === "Closed" ||
    ["closed", "expired", "cancelled"].includes(quote.status?.toLowerCase());

  const handleAcceptAndPay = (response) => {
    // Just open the PaymentModal — no API call yet.
    // Booking is created only after Paystack payment succeeds.
    const providerName =
      response.provider?.businessName ||
      response.provider?.name ||
      "Provider";
    const providerInitials = providerName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    setPaymentData({
      quoteId: quote.id,
      responseId: response.id,
      amount: response.price || 0,
      service: quote.serviceSelections?.map((s) => s.serviceName).join(", ") ||
        quote.serviceType || "Auto Glass Service",
      providerName,
      providerInitials,
      vehicle: quote.vehicle
        ? `${quote.vehicle.year || ""} ${quote.vehicle.make || ""} ${quote.vehicle.model || ""}`.trim()
        : "",
      breakdown: {
        subtotal: response.price || 0,
        vat: response.vat || 0,
        vatPercentage: response.vatPercentage || 0,
      },
    });
    setShowPaymentModal(true);
  };

  const booking = quote?.booking;

  // Booking needs payment if it exists but isn't confirmed/paid yet
  const bookingStatus = booking?.status?.toLowerCase();
  const bookingPaymentStatus = booking?.paymentStatus?.toLowerCase();
  const bookingNeedsPayment =
    isAccepted &&
    (!booking ||
      bookingStatus === "awaiting-payment" ||
      bookingStatus === "awaiting-provider-acceptance" ||
      (!bookingPaymentStatus || bookingPaymentStatus === "unpaid")) &&
    !["confirmed", "in-progress", "completed", "completed-by-fitter"].includes(
      bookingStatus,
    );
  const bookingIsConfirmed =
    isAccepted &&
    booking &&
    (["confirmed", "in-progress", "completed", "completed-by-fitter"].includes(
      bookingStatus,
    ) ||
      bookingPaymentStatus === "paid");

  const handleCloseRequest = async () => {
    setIsClosing(true);
    try {
      const success = await closeQuoteRequest(quote.id);
      if (success) {
        setCloseModal(false);
      }
    } catch (error) {
      console.error("Close quote error:", error);
    } finally {
      setIsClosing(false);
    }
  };

  const handleMessageProvider = () => {
    addToast({ type: "info", message: "Messaging feature coming soon!" });
  };

  const getStatusExplanation = () => {
    // isAccepted (includes !!quote.booking) takes priority over displayed status
    if (isAccepted) {
      if (bookingNeedsPayment) {
        return "Your booking slot has been reserved. Complete payment to confirm your appointment.";
      }
      return "You've accepted a quote. Your booking has been confirmed.";
    }

    const status = quote.status?.toLowerCase() || "";

    if (["open", "pending"].includes(status)) {
      return "Your quote request is live. Providers in your area will start responding soon.";
    }
    if (["responses", "quoted", "received responses"].includes(status)) {
      return "Providers have responded! Review the offers below and accept one to proceed.";
    }
    if (status === "closed") {
      return "This quote request has been closed.";
    }
    return "";
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quote Reference
              </p>
              {responses.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                  {responses.length} {responses.length === 1 ? "Quote" : "Quotes"}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {quote.reference}
            </h2>
            <div className="mt-1">
              <StatusBadge status={quote.status} type="quote" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isClosed && !isAccepted && (quote.status?.toLowerCase() === "open" ||
              quote.status?.toLowerCase() === "pending" ||
              quote.status?.toLowerCase() === "quoted" ||
              quote.status?.toLowerCase() === "responses") && (
              <button
                onClick={() => setCloseModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#DC2626",
                  background: "#FEF2F2",
                  border: "1.5px solid #FECACA",
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                className="hover:!bg-red-100 hover:!border-red-300 dark:!bg-red-900/20 dark:!border-red-800 dark:!text-red-400"
              >
                <X size={14} strokeWidth={2.5} />
                Close Quote
              </button>
            )}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Context Bar (dark gradient summary) ── */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 dark:from-primary-800 dark:to-slate-900 p-5 overflow-hidden shadow-lg">
          {/* Decorative circle */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/[.04]" />
          <div className="relative z-10">
            <div className="flex flex-wrap gap-5">
              {/* Vehicle */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">Vehicle</p>
                <p className="font-display text-[15px] font-bold text-white leading-snug">
                  {typeof quote.vehicle === "object"
                    ? `${quote.vehicle.year || ""} ${quote.vehicle.make || ""} ${quote.vehicle.model || ""}`.trim() || "Unknown"
                    : quote.vehicle || "Unknown"}
                </p>
                {(quote.vehicle?.registrationNumber || quote.vehicle?.regNumber) && (
                  <span className="inline-block font-mono text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded mt-1">
                    {quote.vehicle?.registrationNumber || quote.vehicle?.regNumber}
                  </span>
                )}
                {(quote.vehicleData?.hasAdasCamera || quote.vehicleData?.hasRainSensor) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {quote.vehicleData?.hasAdasCamera && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/80">
                        <CheckCircle2 size={10} /> ADAS
                      </span>
                    )}
                    {quote.vehicleData?.hasRainSensor && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/80">
                        <CheckCircle2 size={10} /> Rain Sensor
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Divider */}
              <div className="w-px bg-white/15 self-stretch hidden sm:block" />
              {/* Damage / Service */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">Damage</p>
                {quote.serviceSelections && quote.serviceSelections.length > 0 ? (
                  <div className="space-y-0.5">
                    {quote.serviceSelections.map((sel, i) => (
                      <p key={i} className="font-display text-[15px] font-bold text-white leading-snug">
                        {sel.glassTypes?.length > 0 ? sel.glassTypes.join(", ") : sel.serviceName}
                        {sel.glassTypes?.length > 0 && (
                          <span className="font-normal text-white/60 text-[13px]"> — {sel.serviceName}</span>
                        )}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="font-display text-[15px] font-bold text-white leading-snug">
                    {Array.isArray(quote.glassTypes) && quote.glassTypes.length > 0
                      ? quote.glassTypes.join(", ")
                      : Array.isArray(quote.serviceTypes) ? quote.serviceTypes.join(", ") : quote.serviceType || "—"}
                  </p>
                )}
                {/* Expire timer */}
                {quote.expiresAt && !isClosed && !isAccepted && (() => {
                  const now = new Date();
                  const expiry = new Date(quote.expiresAt);
                  const diff = expiry - now;
                  if (diff <= 0) return null;
                  const h = Math.floor(diff / 3600000);
                  const m = Math.floor((diff % 3600000) / 60000);
                  const label = h >= 24
                    ? `Expires ${expiry.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} at ${expiry.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false })}`
                    : h > 0 ? `Expires in ${h}h ${m}m` : `Expires in ${m}m`;
                  return (
                    <div className="flex items-center gap-1.5 mt-2 text-[14px] font-semibold text-white/80">
                      <Clock size={14} />
                      {label}
                    </div>
                  );
                })()}
              </div>
              {/* Divider */}
              <div className="w-px bg-white/15 self-stretch hidden sm:block" />
              {/* Location */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">Location</p>
                <p className="font-display text-[15px] font-bold text-white leading-snug">
                  {quote.location?.city || "—"}
                </p>
                {quote.location?.addressLine1 && (
                  <p className="text-[13px] text-white/65 mt-0.5">{quote.location.addressLine1}</p>
                )}
              </div>
            </div>

            {/* Damage images row inside context bar */}
            {quote.images && quote.images.length > 0 && (
              <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-white/10">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mr-1">Photos</p>
                {quote.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className="w-11 h-11 rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/60 transition-all hover:scale-110 flex-shrink-0"
                  >
                    <img
                      src={
                        typeof img === "object"
                          ? img.data || img.url
                          : img.startsWith("http") || img.startsWith("data:")
                            ? img
                            : `${NodeURL}${img}`
                      }
                      alt={`Damage ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Journey Bar (horizontal stepper) ── */}
        {(() => {
          const statusLower = quote.status?.toLowerCase() || "";
          const journeySteps = [
            { label: "Sent" },
            { label: "Providers" },
            { label: "Reviewed" },
            { label: "Paid" },
            { label: "Book Appt" },
            { label: "Confirmed" },
          ];
          const hasSchedule = booking?.scheduledDate;
          let currentJourneyStep = 0;
          if (["open", "pending"].includes(statusLower)) currentJourneyStep = 1;
          if (["responses", "quoted", "received responses"].includes(statusLower)) currentJourneyStep = 2;
          if (isAccepted && bookingNeedsPayment) currentJourneyStep = 3;
          if (isAccepted && bookingIsConfirmed && !hasSchedule) currentJourneyStep = 4;
          if (isAccepted && bookingIsConfirmed && hasSchedule) currentJourneyStep = 5;
          if (isClosed) currentJourneyStep = -1;

          return (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center">
                {journeySteps.map((step, i) => {
                  const isDone = isClosed ? false : i < currentJourneyStep;
                  const isNow = !isClosed && i === currentJourneyStep;

                  return (
                    <div key={i} className={`flex-1 flex flex-col items-center relative ${i < journeySteps.length - 1 ? "after:content-[''] after:absolute after:left-1/2 after:top-4 after:w-full after:h-0.5 after:z-0" : ""} ${isDone && i < journeySteps.length - 1 ? "after:bg-green-500" : isNow && i < journeySteps.length - 1 ? "after:bg-gradient-to-r after:from-primary-500 after:to-slate-200 dark:after:to-slate-600" : i < journeySteps.length - 1 ? "after:bg-slate-200 dark:after:bg-slate-600" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 text-xs font-bold transition-all ${isDone ? "bg-green-600 text-white" : isNow ? "bg-primary-600 text-white shadow-[0_0_0_4px] shadow-primary-100 dark:shadow-primary-900/40" : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"}`}>
                        {isDone ? <Check size={14} /> : i + 1}
                      </div>
                      <p className={`text-[10px] font-semibold mt-2 text-center leading-tight ${isDone ? "text-green-600 dark:text-green-400" : isNow ? "text-primary-700 dark:text-primary-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Notice Bar ── */}
        <div className="p-4 rounded-xl flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
          <AlertCircle size={17} className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <p className="text-[.875rem] leading-relaxed text-primary-700 dark:text-primary-300">
            {isAccepted ? (
              bookingIsConfirmed && booking?.scheduledDate
                ? "Your appointment is confirmed. You can view it in your bookings."
                : bookingIsConfirmed && !booking?.scheduledDate
                  ? <><strong>Payment successful!</strong> Now choose your preferred appointment date and time.</>
                  : bookingNeedsPayment
                    ? <><strong>Payment required.</strong> Complete payment to confirm your appointment.</>
                    : "You've accepted a quote. Your booking has been confirmed."
            ) : isClosed ? (
              "This quote request has been closed."
            ) : responses.length > 0 ? (
              <>
                <strong>{responses.length} of {quote.providerCount || responses.length} providers have responded.</strong>
                {(() => {
                  const remaining = (quote.providerCount || 0) - responses.length;
                  if (remaining <= 0) return " All providers have responded. Review the offers below.";
                  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
                  const remainWord = remaining <= 10 ? words[remaining] : String(remaining);
                  return ` ${remainWord} more ${remaining === 1 ? "quote is" : "quotes are"} on the way. You can accept now or wait`;
                })()}
                {quote.providerCount > responses.length && quote.expiresAt && (() => {
                  const diff = new Date(quote.expiresAt) - new Date();
                  if (diff <= 0) return null;
                  const totalH = Math.floor(diff / 3600000);
                  const m = Math.floor((diff % 3600000) / 60000);
                  const d = Math.floor(totalH / 24);
                  const h = totalH % 24;
                  if (d > 0) return ` — all quotes are valid for ${d} ${d === 1 ? "day" : "days"} ${h} hours ${m} minutes.`;
                  return h > 0
                    ? ` — all quotes are valid for ${h} hours ${m} minutes.`
                    : ` — all quotes are valid for ${m} minutes.`;
                })()}
              </>
            ) : (
              <>
                Your quote request is live. Providers in your area will start responding soon.
                {quote.expiresAt && (() => {
                  const diff = new Date(quote.expiresAt) - new Date();
                  if (diff <= 0) return null;
                  const totalH = Math.floor(diff / 3600000);
                  const m = Math.floor((diff % 3600000) / 60000);
                  const d = Math.floor(totalH / 24);
                  const h = totalH % 24;
                  if (d > 0) return ` Quotes are valid for ${d} ${d === 1 ? "day" : "days"} ${h} hours ${m} minutes.`;
                  return h > 0
                    ? ` Quotes are valid for ${h} hours ${m} minutes.`
                    : ` Quotes are valid for ${m} minutes.`;
                })()}
              </>
            )}
          </p>
        </div>

        {/* Payment Pending Banner */}
        {bookingNeedsPayment && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">Payment Required</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Complete payment to confirm your appointment.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                // Find the accepted response for this quote
                const acceptedResp = responses.find(
                  (r) => r.status === "Accepted" || r.status === "accepted"
                );
                if (acceptedResp) {
                  handleAcceptAndPay(acceptedResp);
                } else if (booking) {
                  // Fallback for old-flow bookings that exist but need payment
                  setPaymentData(booking);
                  setShowPaymentModal(true);
                }
              }}
              className="whitespace-nowrap"
            >
              Pay Now
            </Button>
          </div>
        )}

        {/* Booking Confirmed — Provider Bar + Book Appointment CTA */}
        {bookingIsConfirmed && (() => {
          const acceptedResp = responses.find((r) => r.status === "Accepted");
          const provName = acceptedResp?.provider?.businessName || acceptedResp?.provider?.name || booking?.providerName || "Provider";
          const provInitials = provName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
          const svcLabel = quote.serviceSelections?.length > 0
            ? quote.serviceSelections.map((s) => s.serviceName).join(", ")
            : quote.serviceType || "Windscreen Service";
          const vehicleLabel = typeof quote.vehicle === "object"
            ? `${quote.vehicle.make || ""} ${quote.vehicle.model || ""}`.trim()
            : quote.vehicle || "";
          const paidAmount = booking?.price?.total || acceptedResp?.price || 0;

          return (
            <div
              style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "1rem",
                padding: "1.25rem 1.5rem",
                boxShadow: "0 1px 3px rgba(15,23,42,.06)",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                flexWrap: "wrap",
              }}
              className="dark:!bg-slate-800 dark:!border-slate-700"
            >
              {/* Provider logo */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "1rem",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.125rem",
                  color: "#fff",
                  background: "linear-gradient(135deg, #16A34A, #15803D)",
                  boxShadow: "0 4px 6px -1px rgba(15,23,42,.08)",
                }}
              >
                {provInitials}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0F172A" }} className="dark:!text-white">
                  {provName}
                </div>
                <div style={{ fontSize: ".875rem", color: "#64748B", marginTop: ".125rem" }}>
                  {svcLabel}{vehicleLabel ? ` · ${vehicleLabel}` : ""}
                </div>
              </div>

              {/* Price + Paid badge */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0F172A", lineHeight: 1 }} className="dark:!text-white">
                  {formatCurrency(paidAmount)}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".25rem",
                    fontSize: ".6875rem",
                    fontWeight: 600,
                    color: "#15803D",
                    background: "#DCFCE7",
                    padding: ".2rem .625rem",
                    borderRadius: "9999px",
                    marginTop: ".375rem",
                  }}
                >
                  <Check size={11} /> Paid in full
                </div>
              </div>
            </div>
          );
        })()}

        {/* Book Appointment CTA — show when paid but no schedule yet */}
        {bookingIsConfirmed && !booking?.scheduledDate && (
          <button
            onClick={() => navigate(`/dashboard/quotes/${quote.id}/book-appointment`)}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(37,99,235,.25)",
              transition: "all 150ms",
            }}
            className="hover:shadow-lg hover:-translate-y-px"
          >
            <CalendarCheck size={18} />
            Book Your Appointment
            <ArrowRight size={16} />
          </button>
        )}

        {/* Appointment Confirmed — show when paid AND scheduled */}
        {bookingIsConfirmed && booking?.scheduledDate && (
          <div
            style={{
              background: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
              border: "1px solid #86EFAC",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
            }}
            className="dark:!bg-green-900/20 dark:!border-green-800"
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={18} style={{ color: "#fff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".9375rem", fontWeight: 700, color: "#14532D" }} className="dark:!text-green-200">
                Appointment Confirmed
              </div>
              <div style={{ fontSize: ".8125rem", color: "#166534" }} className="dark:!text-green-400">
                {formatDate(booking.scheduledDate, "long")}{booking.scheduledTimeSlot ? ` · ${typeof booking.scheduledTimeSlot === "object" ? `${booking.scheduledTimeSlot.start || ""}${booking.scheduledTimeSlot.end ? ` - ${booking.scheduledTimeSlot.end}` : ""}` : booking.scheduledTimeSlot}` : ""}
              </div>
            </div>
            <button
              onClick={() => navigate(`/dashboard/bookings/${booking._id || booking.id}`)}
              style={{
                padding: ".5rem 1rem",
                borderRadius: ".75rem",
                background: "#16A34A",
                color: "#fff",
                fontSize: ".875rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: ".375rem",
              }}
              className="hover:!bg-green-700"
            >
              View Booking <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── Customer Notes ── */}
        {quote.notes && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Customer Notes</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{quote.notes}</p>
          </div>
        )}

        {/* ── Provider Responses with Filter ── */}
        <div>
          {/* Header + count */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {responses.length > 0 ? `${responses.length} Quotes Received` : "Provider Responses"}
            </h3>
            {quote.providerCount > responses.length && responses.length > 0 && (
              <span className="text-[13px] text-slate-400">
                {quote.providerCount - responses.length} more pending
              </span>
            )}
          </div>

          {/* Filter chips */}
          {responses.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: "best-price", label: "Best Price", icon: <SlidersHorizontal size={12} /> },
                { key: "earliest", label: "Earliest Available", icon: null },
                { key: "top-rated", label: "Top Rated", icon: null },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSortFilter(filter.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold border-[1.5px] transition-all ${
                    sortFilter === filter.key
                      ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200 dark:shadow-primary-900/40"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          {responses.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Clock
                size={32}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
              />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Waiting for provider responses
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Most quotes receive responses within 2-4 hours
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...responses]
                .sort((a, b) => {
                  // Always show accepted response first
                  const aAccepted = a.status === "Accepted" || a.status === "accepted";
                  const bAccepted = b.status === "Accepted" || b.status === "accepted";
                  if (aAccepted && !bAccepted) return -1;
                  if (!aAccepted && bAccepted) return 1;

                  if (sortFilter === "best-price") return (a.price || 0) - (b.price || 0);
                  if (sortFilter === "top-rated") return (b.provider?.rating || 0) - (a.provider?.rating || 0);
                  if (sortFilter === "earliest") return (a.estimatedDuration || 9999) - (b.estimatedDuration || 9999);
                  return 0;
                })
                .map((response, idx) => {
                  const thisAccepted = response.status === "Accepted" || response.status === "accepted";
                  // If any response in this quote is accepted, mark non-accepted ones as rejected
                  const thisRejected = response.status === "Rejected" || response.status === "rejected" ||
                    (isAccepted && !thisAccepted);
                  return (
                  <ProviderResponseCard
                    key={response.id}
                    response={{ ...response, _bestValue: sortFilter === "best-price" && idx === 0 && !isAccepted }}
                    isAccepted={thisAccepted}
                    isRejected={thisRejected}
                    disabled={isAccepted || isClosed}
                    bookingConfirmed={bookingIsConfirmed}
                    quoteData={quote}
                    onAccept={() => handleAcceptAndPay(response)}
                    onMessage={handleMessageProvider}
                  />
                  );
                })}
            </div>
          )}
        </div>

        {/* Request Date */}
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Requested on {formatDate(quote.createdAt, "long")}
        </p>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        payment={
          paymentData
            ? {
                // Quote-first flow: pass quoteId+responseId (no booking yet)
                quoteId: paymentData.quoteId || undefined,
                responseId: paymentData.responseId || undefined,
                // Standard flow fallback
                bookingId:
                  paymentData._id ||
                  paymentData.bookingId ||
                  paymentData.id ||
                  paymentData.booking?._id,
                amount:
                  paymentData.totalAmount ||
                  paymentData.amount ||
                  paymentData.price?.total ||
                  paymentData.booking?.price?.total ||
                  0,
                service:
                  paymentData.serviceType ||
                  paymentData.service ||
                  paymentData.booking?.serviceType ||
                  "Windscreen Service",
                breakdown: {
                  subtotal:
                    paymentData.breakdown?.subtotal ||
                    paymentData.price?.subtotal ||
                    paymentData.booking?.price?.subtotal ||
                    paymentData.totalAmount ||
                    0,
                  vat:
                    paymentData.breakdown?.vat ||
                    paymentData.price?.vat ||
                    paymentData.booking?.price?.vat ||
                    0,
                  vatPercentage:
                    paymentData.breakdown?.vatPercentage ||
                    paymentData.price?.vatPercentage ||
                    paymentData.booking?.price?.vatPercentage ||
                    0,
                },
                providerName:
                  paymentData.providerName ||
                  paymentData.provider?.businessName ||
                  paymentData.provider?.name ||
                  paymentData.booking?.providerName ||
                  "",
                providerInitials:
                  paymentData.providerInitials ||
                  (paymentData.providerName || paymentData.provider?.businessName || paymentData.provider?.name || paymentData.booking?.providerName || "P")
                    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
                providerColor: paymentData.providerColor || undefined,
                vehicle: paymentData.vehicle || (typeof quote.vehicle === "object"
                  ? `${quote.vehicle.year || ""} ${quote.vehicle.make || ""} ${quote.vehicle.model || ""}`.trim()
                  : quote.vehicle || ""),
                registrationNumber:
                  paymentData.registrationNumber ||
                  quote.vehicle?.registrationNumber ||
                  "",
                customerName:
                  paymentData.customerName ||
                  quote.customerName ||
                  user?.name ||
                  "",
              }
            : null
        }
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          if (quote?.id) fetchQuoteDetails(quote.id);
        }}
      />

      {/* Close Confirmation Modal */}
      <Modal
        isOpen={closeModal}
        onClose={() => setCloseModal(false)}
        title="Close Quote Request?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to close this quote request? You won't receive
            any more responses from providers.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setCloseModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1 whitespace-nowrap"
              onClick={handleCloseRequest}
              loading={isClosing}
            >
              Close Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <img
            src={
              typeof selectedImage === "object"
                ? selectedImage.data || selectedImage.url
                : selectedImage.startsWith("http") ||
                    selectedImage.startsWith("data:")
                  ? selectedImage
                  : `${NodeURL}${selectedImage}`
            }
            alt="Damage"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default QuoteDetailPanel;
