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
  Shield,
  ShieldCheck,
} from "lucide-react";
import useDashboardStore, {
  formatDate,
  formatCurrency,
} from "../../store/useDashboardStore";
import { NodeURL } from "../../services/api";
import paymentService from "../../services/paymentService";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";
import ProviderResponseCard from "./ProviderResponseCard";
import Modal from "../ui/Modal";
import PaymentModal from "./PaymentModal";
import Tooltip from "../ui/Tooltip";
import { useSettingsStore } from "../../store/useSettingsStore";

const QuoteDetailPanel = ({ quote, onClose }) => {
  const navigate = useNavigate();
  const {
    user,
    quoteResponses,
    closeQuoteRequest,
    addToast,
    fetchQuoteDetails,
  } = useDashboardStore();
  const platformSettings = useSettingsStore((s) => s.settings);
  const [selectedImage, setSelectedImage] = useState(null);
  const [closeModal, setCloseModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [sortFilter, setSortFilter] = useState("best-price");
  const [closePanelModal, setClosePanelModal] = useState(false);

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

  const responses = quoteResponses.filter((r) => {
    if (r.quoteRequestId !== quote.id) return false;
    // Keep accepted responses even if provider is deleted
    if (r.status === "accepted" || r.status === "Accepted") return true;
    // Hide responses from deleted/missing providers
    if (!r.provider || r.provider.isDeleted) return false;
    return true;
  });
  const isAccepted =
    quote.status === "Accepted" ||
    quote.status?.toLowerCase() === "accepted" ||
    !!quote.booking;

  // Find the accepted/selected response — check status OR match acceptedResponse ID
  const acceptedResponseId = quote.acceptedResponse?._id || quote.acceptedResponse;
  const findAcceptedResponse = () =>
    responses.find(
      (r) =>
        r.status === "Accepted" ||
        r.status === "accepted" ||
        (acceptedResponseId && (r.id === acceptedResponseId || r._id === acceptedResponseId))
    );
  const isClosed =
    quote.status === "Closed" ||
    ["closed", "expired", "cancelled"].includes(quote.status?.toLowerCase());

  const handleAcceptAndPay = async (response) => {
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

    // Resolve provider avatar URL
    const rawAvatar = response.provider?.avatarUrl || response.provider?.personalImageUrl || response.provider?.companyLogoUrl || response.provider?.profileImage;
    const providerAvatar = rawAvatar
      ? rawAvatar.startsWith("http") || rawAvatar.startsWith("data:") ? rawAvatar : `${NodeURL}${rawAvatar}`
      : null;

    // For insurance-registered providers, response.price = customer excess
    const subtotal = response.price || 0;
    const vatRate = platformSettings?.vatPercentage || 0;
    const vatAmount = vatRate > 0 ? Math.round(subtotal * (vatRate / 100) * 100) / 100 : 0;
    const total = subtotal + vatAmount;

    // Insurance info for display in PaymentModal
    const isInsuranceRegistered = response.isInsuranceRegistered && quote.hasInsurance;
    const insuranceBreakdown = isInsuranceRegistered ? {
      totalJobValue: response.insuranceDetails?.totalJobValue || 0,
      customerExcess: response.insuranceDetails?.customerExcess || subtotal,
      insurerCovers: response.insuranceDetails?.insurerClaimAmount ||
        (response.insuranceDetails?.totalJobValue || 0) - (response.insuranceDetails?.customerExcess || subtotal),
    } : null;

    // R0 insurance — skip payment modal, call backend directly
    if (isInsuranceRegistered && total === 0) {
      try {
        const res = await paymentService.initializePaystack(
          { quoteId: quote.id, responseId: response.id },
          false,
        );
        if (res.success && res.redirect_url) {
          window.location.href = res.redirect_url;
          return;
        }
        // Backend didn't return redirect — show error
        addToast?.({ type: "error", message: res.message || "Failed to confirm insurance booking. Please try again." });
        return;
      } catch (err) {
        import.meta.env.DEV && console.error("R0 insurance confirm error:", err);
        addToast?.({ type: "error", message: "Failed to confirm insurance booking. Please try again." });
        return;
      }
    }

    setPaymentData({
      quoteId: quote.id,
      responseId: response.id,
      amount: total,
      service: quote.serviceSelections?.map((s) => s.serviceName).join(", ") ||
        quote.serviceType || "Auto Glass Service",
      providerName,
      providerInitials,
      providerAvatar,
      vehicle: quote.vehicle
        ? `${quote.vehicle.year || ""} ${quote.vehicle.make || ""} ${quote.vehicle.model || ""}`.trim()
        : "",
      registrationNumber: quote.vehicle?.registrationNumber || "",
      breakdown: {
        subtotal,
        vat: vatAmount,
        vatPercentage: vatRate,
      },
      isInsuranceRegistered,
      insuranceBreakdown,
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
      <div className="qdp-header sticky top-0 bg-white dark:bg-slate-900 z-10 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
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
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
                className="hidden sm:inline-flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-[1.5px] border-red-200 dark:border-red-800 hover:bg-red-100 hover:border-red-300"
              >
                <X size={14} strokeWidth={2.5} />
                Close Quote
              </button>
            )}
            <button
              onClick={() => {
                if (!isClosed && !isAccepted) {
                  setClosePanelModal(true);
                } else {
                  onClose();
                }
              }}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="qdp-body p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* ── Context Bar (dark gradient summary) ── */}
        <div className="qdp-context-bar relative rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 dark:from-primary-800 dark:to-slate-900 p-4 sm:p-5 overflow-hidden shadow-lg">
          {/* Decorative circle */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/[.04]" />
          <div className="relative z-10">
            <div className="qdp-context-gap flex flex-wrap gap-3 sm:gap-5">
              {/* Vehicle */}
              <div className="w-full sm:flex-1 sm:min-w-0">
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
              <div className="w-full sm:flex-1 sm:min-w-0">
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
                  const totalH = Math.floor(diff / 3600000);
                  const m = Math.floor((diff % 3600000) / 60000);
                  const d = Math.floor(totalH / 24);
                  const h = totalH % 24;
                  const label = d > 0
                    ? `Expires in ${d} ${d === 1 ? "day" : "days"} ${h}h ${m}m`
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
              {/* Service Location */}
              <div className="w-full sm:flex-1 sm:min-w-0">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">Service Mode</p>
                {quote?.serviceLocation?.type && quote.serviceLocation.type !== "any" ? (
                  <span
                    className="inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{
                      backgroundColor: quote.serviceLocation.type === "mobile" ? "rgba(219,234,254,0.9)" : "rgba(254,243,199,0.9)",
                      color: quote.serviceLocation.type === "mobile" ? "#1d4ed8" : "#92400e",
                    }}
                  >
                    {quote.serviceLocation.type === "mobile" ? "Mobile" : "Workshop"}
                  </span>
                ) : (
                  <p className="font-display text-[15px] font-bold text-white leading-snug">—</p>
                )}
              </div>
              {/* Insurance Status */}
              {quote?.hasInsurance && (
                <>
                  <div className="w-px bg-white/15 self-stretch hidden sm:block" />
                  <div className="w-full sm:flex-1 sm:min-w-0">
                    <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1">Insurance</p>
                    <span className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-white/15 text-white/90">
                      <Shield size={11} />
                      {quote.insuranceDetails?.claimStatus === "claim_pending"
                        ? "Claim Pending"
                        : "Claim Reference"}
                    </span>
                    {quote.insuranceDetails?.claimNumber && (
                      <p className="font-mono text-xs text-white/60 mt-1">
                        Ref: {quote.insuranceDetails.claimNumber}
                      </p>
                    )}
                    {quote.insuranceDetails?.excessAmount > 0 && (
                      <p className="text-xs text-white/50 mt-0.5">
                        Excess: R{quote.insuranceDetails.excessAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </>
              )}
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
            <div className="qdp-stepper bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-1.5 py-3 sm:p-5 shadow-sm">
              <div className="flex items-start">
                {journeySteps.map((step, i) => {
                  const isDone = isClosed ? false : i < currentJourneyStep;
                  const isNow = !isClosed && i === currentJourneyStep;

                  return (
                    <div key={i} className={`flex-1 flex flex-col items-center relative ${i < journeySteps.length - 1 ? "after:content-[''] after:absolute after:left-1/2 after:top-3 sm:after:top-4 after:w-full after:h-0.5 after:z-0" : ""} ${isDone && i < journeySteps.length - 1 ? "after:bg-green-500" : isNow && i < journeySteps.length - 1 ? "after:bg-gradient-to-r after:from-primary-500 after:to-slate-200 dark:after:to-slate-600" : i < journeySteps.length - 1 ? "after:bg-slate-200 dark:after:bg-slate-600" : ""}`}>
                      <div className={`qdp-step-circle w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center relative z-10 text-[10px] sm:text-xs font-bold transition-all ${isDone ? "bg-green-600 text-white" : isNow ? "bg-primary-600 text-white shadow-[0_0_0_3px] sm:shadow-[0_0_0_4px] shadow-primary-100 dark:shadow-primary-900/40" : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"}`}>
                        {isDone ? <Check size={12} /> : i + 1}
                      </div>
                      <p className={`qdp-step-label text-[8px] sm:text-[10px] font-semibold mt-1 sm:mt-2 text-center leading-tight ${isDone ? "text-green-600 dark:text-green-400" : isNow ? "text-primary-700 dark:text-primary-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
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
                // Find the accepted/selected response for this quote
                const acceptedResp = findAcceptedResponse();
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
          const acceptedResp = responses.find((r) => r.status === "Accepted" || r.status === "accepted");
          const provName = acceptedResp?.provider?.businessName || acceptedResp?.provider?.name || booking?.providerName || "Provider";
          const provInitials = provName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
          const provAvatarRaw = acceptedResp?.provider?.avatarUrl || acceptedResp?.provider?.personalImageUrl || acceptedResp?.provider?.companyLogoUrl || acceptedResp?.provider?.profileImage;
          const provAvatarUrl = provAvatarRaw ? (provAvatarRaw.startsWith("http") || provAvatarRaw.startsWith("data:") ? provAvatarRaw : `${NodeURL}${provAvatarRaw}`) : null;
          const svcLabel = quote.serviceSelections?.length > 0
            ? quote.serviceSelections.map((s) => s.serviceName).join(", ")
            : quote.serviceType || "Windscreen Service";
          const vehicleLabel = typeof quote.vehicle === "object"
            ? `${quote.vehicle.make || ""} ${quote.vehicle.model || ""}`.trim()
            : quote.vehicle || "";
          const paidAmount = +(booking?.price?.total) || +(acceptedResp?.price) || 0;
          const isInsuranceClaim = (booking?.isInsuranceClaim || (acceptedResp?.isInsuranceRegistered && quote?.hasInsurance));
          const isRegisteredProvider = acceptedResp?.isInsuranceRegistered || booking?.insuranceDetails?.isRegisteredProvider;
          const totalJobValue = +(acceptedResp?.insuranceDetails?.totalJobValue) || +(booking?.insuranceDetails?.totalJobValue) || 0;

          return (
            <div
              style={{
                borderRadius: "1rem",
                boxShadow: "0 1px 3px rgba(15,23,42,.06)",
              }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-3 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {/* Top row: Avatar + Info */}
              <div className="flex items-center gap-3 sm:gap-5 sm:flex-1 sm:min-w-0">
                {/* Provider logo */}
                {provAvatarUrl ? (
                  <img
                    src={provAvatarUrl}
                    alt={provName}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "1rem",
                      flexShrink: 0,
                      objectFit: "cover",
                      boxShadow: "0 4px 6px -1px rgba(15,23,42,.08)",
                    }}
                  />
                ) : (
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
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: "1.0625rem", fontWeight: 700 }} className="text-slate-900 dark:text-white">
                      {provName}
                    </span>
                    {acceptedResp?.provider?.businessType !== "individual" && acceptedResp?.provider?.vatNumber && (
                      <span className="text-[0.625rem] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                        VAT Registered
                      </span>
                    )}
                    {quote?.hasInsurance && acceptedResp?.provider?.insurancePartnerships?.some(p => p.isActive) && (
                      <span className="inline-flex items-center gap-0.5 text-[0.625rem] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                        <ShieldCheck size={9} />
                        Insurance Approved
                      </span>
                    )}
                  </div>
                  {/* Mobile: truncated + tooltip on tap */}
                  <Tooltip content={`${svcLabel}${vehicleLabel ? ` · ${vehicleLabel}` : ""}`} position="bottom" className="sm:!hidden block">
                    <div style={{ fontSize: ".8125rem", marginTop: ".125rem" }} className="text-slate-500 dark:text-slate-400 truncate sm:text-sm">
                      {svcLabel}{vehicleLabel ? ` · ${vehicleLabel}` : ""}
                    </div>
                  </Tooltip>
                  {/* Desktop: normal wrapping, no tooltip needed */}
                  <div style={{ fontSize: ".8125rem", marginTop: ".125rem" }} className="text-slate-500 dark:text-slate-400 hidden sm:block sm:text-sm">
                    {svcLabel}{vehicleLabel ? ` · ${vehicleLabel}` : ""}
                  </div>
                </div>
              </div>

              {/* Divider — mobile only */}
              <div className="border-t border-slate-100 dark:border-slate-700 sm:hidden" />

              {/* Price + Paid badge */}
              <div className="flex items-center justify-between sm:block sm:text-right sm:flex-shrink-0">
                <div style={{ fontSize: "1.375rem", fontWeight: 800, lineHeight: 1 }} className="text-slate-900 dark:text-white">
                  {formatCurrency(isInsuranceClaim && isRegisteredProvider && paidAmount === 0 && totalJobValue > 0 ? totalJobValue : paidAmount)}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".25rem",
                    fontSize: ".6875rem",
                    fontWeight: 600,
                    padding: ".2rem .625rem",
                    borderRadius: "9999px",
                  }}
                  className="text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20 sm:mt-1.5"
                >
                  {isInsuranceClaim && isRegisteredProvider ? (
                    paidAmount === 0 ? (<><ShieldCheck size={11} /> Insurance Covered</>) : (<><ShieldCheck size={11} /> Excess Paid</>)
                  ) : (
                    <><Check size={11} /> Paid in full</>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Book Appointment CTA — show when paid but no schedule yet */}
        {bookingIsConfirmed && !booking?.scheduledDate && (
          <button
            onClick={() => navigate(`/dashboard/quotes/${quote.id}/book-appointment`)}
            className="w-full sm:max-w-md sm:mx-auto flex items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-px"
            style={{
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
              borderRadius: "1rem",
              flexWrap: "wrap",
            }}
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-5 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 border border-green-300 dark:border-green-800"
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={18} style={{ color: "#fff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".9375rem", fontWeight: 700 }} className="text-green-900 dark:text-green-200">
                Appointment Confirmed
              </div>
              <div style={{ fontSize: ".8125rem" }} className="text-green-800 dark:text-green-400">
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
                justifyContent: "center",
                gap: ".375rem",
                flexShrink: 0,
              }}
              className="w-full sm:w-auto flex items-center justify-center hover:brightness-110"
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
          {responses.length > 1 && !isAccepted && !isClosed && (
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
          ) : (() => {
            const isInsuranceQuote = quote?.hasInsurance;
            const sortResponses = (list) =>
              [...list].sort((a, b) => {
                const aAccepted = a.status === "Accepted" || a.status === "accepted";
                const bAccepted = b.status === "Accepted" || b.status === "accepted";
                if (aAccepted && !bAccepted) return -1;
                if (!aAccepted && bAccepted) return 1;
                if (sortFilter === "best-price") return (a.price || 0) - (b.price || 0);
                if (sortFilter === "top-rated") return (b.provider?.rating || 0) - (a.provider?.rating || 0);
                if (sortFilter === "earliest") return (a.estimatedDuration || 9999) - (b.estimatedDuration || 9999);
                return 0;
              });
            const renderCard = (response, idx, listForBest) => {
              const thisAccepted =
                response.status === "Accepted" ||
                response.status === "accepted" ||
                (acceptedResponseId && (response.id === acceptedResponseId || response._id === acceptedResponseId));
              const thisRejected = response.status === "Rejected" || response.status === "rejected" ||
                (isAccepted && !thisAccepted);
              return (
                <ProviderResponseCard
                  key={response.id}
                  response={{ ...response, _bestValue: sortFilter === "best-price" && idx === 0 && !isAccepted && listForBest }}
                  isAccepted={thisAccepted}
                  isRejected={thisRejected}
                  disabled={isAccepted || isClosed}
                  bookingConfirmed={bookingIsConfirmed}
                  quoteData={quote}
                  onAccept={() => handleAcceptAndPay(response)}
                  onMessage={handleMessageProvider}
                />
              );
            };

            if (isInsuranceQuote) {
              const registeredResponses = sortResponses(responses.filter(r => r.isInsuranceRegistered));
              const otherResponses = sortResponses(responses.filter(r => !r.isInsuranceRegistered));
              return (
                <>
                  {registeredResponses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-display font-bold text-[0.9375rem] text-emerald-700 dark:text-emerald-400">
                          Insurance-Approved Providers
                        </h3>
                        <span className="text-[0.75rem] text-emerald-500 dark:text-emerald-500">
                          ({registeredResponses.length})
                        </span>
                      </div>
                      <p className="text-[0.8125rem] text-emerald-600/70 dark:text-emerald-400/70 mb-3 px-1">
                        These providers handle your insurance claim directly. You only pay your excess.
                      </p>
                      <div className="space-y-4">
                        {registeredResponses.map((r, idx) => renderCard(r, idx, true))}
                      </div>
                    </div>
                  )}
                  {otherResponses.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-display font-bold text-[0.9375rem] text-neutral-700 dark:text-neutral-300 mb-2 px-1">
                        Other Providers
                      </h3>
                      <p className="text-[0.8125rem] text-neutral-500 dark:text-neutral-400 mb-3 px-1">
                        Full payment required. Claim reimbursement from your insurer with your AutoScreen receipt.
                      </p>
                      <div className="space-y-4">
                        {otherResponses.map((r, idx) => renderCard(r, idx, registeredResponses.length === 0))}
                      </div>
                    </div>
                  )}
                </>
              );
            }

            // Non-insurance quotes — flat list (unchanged)
            const sorted = sortResponses(responses);
            return (
              <div className="space-y-4">
                {sorted.map((response, idx) => renderCard(response, idx, true))}
              </div>
            );
          })()}
        </div>

        {/* Request Date — removed per design request */}
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

      {/* Close Panel Confirmation Modal (mobile) */}
      <Modal
        isOpen={closePanelModal}
        onClose={() => setClosePanelModal(false)}
        title="Before you go..."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Would you like to close this quote request, or just go back to the list?
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="danger"
              className="w-full whitespace-nowrap"
              onClick={() => {
                setClosePanelModal(false);
                handleCloseRequest();
              }}
              loading={isClosing}
            >
              Close Quote Request
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setClosePanelModal(false);
                onClose();
              }}
            >
              Go Back to List
            </Button>
            <button
              onClick={() => setClosePanelModal(false)}
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
            >
              Cancel
            </button>
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
