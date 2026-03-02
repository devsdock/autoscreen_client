import { useState, useEffect } from "react";
import {
  Phone,
  MapPin,
  Clock,
  Car,
  CheckCircle,
  Circle,
  X,
  Download,
  CreditCard,
  Star,
  Shield,
  Loader2,
  FileText,
  MessageSquare,
  Layers,
  RotateCcw,
} from "lucide-react";
import Drawer, { DrawerFooter } from "../ui/Drawer";
import StatusBadge from "../ui/StatusBadge";
import Tooltip from "../ui/Tooltip";
import Rating from "../ui/Rating";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import Modal, { ModalActions } from "../ui/Modal";
import { Player } from "@lottiefiles/react-lottie-player";
import PaymentModal from "./PaymentModal";
import useDashboardStore, {
  formatDate,
  formatCurrency,
} from "../../store/useDashboardStore";
import bookingService from "../../services/bookingService";
import { downloadInvoice } from "../../utils/invoiceUtils";
import { useNavigate } from "react-router-dom";
import ReviewModal from "./ReviewModal";

const BookingDetailDrawer = ({
  booking,
  isOpen,
  onClose,
  onUpdate,
  initialAction,
}) => {
  const navigate = useNavigate();
  const { addToast } = useDashboardStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelQuoteLoading, setCancelQuoteLoading] = useState(false);
  const [cancelQuote, setCancelQuote] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const [convertedImages, setConvertedImages] = useState({});

  const rawDamageImages =
    booking?.damageImages ||
    booking?.quote?.damageImages ||
    booking?.completionDetails?.beforeImages ||
    [];

  // Handle HEIC conversions for existing booking data
  useEffect(() => {
    if (rawDamageImages.length > 0 && window.heic2any) {
      rawDamageImages.forEach(async (img, idx) => {
        const isHeic =
          typeof img === "string" &&
          (img.startsWith("data:image/heic") ||
            img.toLowerCase().endsWith(".heic"));

        if (isHeic && !convertedImages[idx]) {
          try {
            const response = await fetch(img);
            const blob = await response.blob();
            const result = await window.heic2any({
              blob,
              toType: "image/jpeg",
              quality: 0.7,
            });
            const convertedBlob = Array.isArray(result) ? result[0] : result;
            const url = URL.createObjectURL(convertedBlob);
            setConvertedImages((prev) => ({ ...prev, [idx]: url }));
          } catch (err) {
            console.error("Failed to convert HEIC image:", err);
          }
        }
      });
    }

    return () => {
      Object.values(convertedImages).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [rawDamageImages]);

  const damageImages = rawDamageImages.map(
    (img, idx) => convertedImages[idx] || img,
  );

  const handleCancel = async () => {
    setLoading(true);
    try {
      await bookingService.cancelBooking(booking.id, cancelReason);
      addToast({ type: "success", message: "Booking cancelled successfully" });
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      addToast({ type: "error", message: "Failed to cancel booking" });
    } finally {
      setLoading(false);
      setShowCancelModal(false);
      setCancelQuote(null);
    }
  };

  const handleOpenCancelModal = async () => {
    setCancelQuoteLoading(true);
    setShowCancelModal(true); // Open modal early so it shows a spinner
    try {
      const resp = await bookingService.getCancellationQuote(booking.id);
      if (resp.success) {
        setCancelQuote(resp.data);
      }
    } catch (error) {
      console.error("Failed to fetch cancellation quote:", error);
    } finally {
      setCancelQuoteLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    setReviewLoading(true);
    try {
      const res = await bookingService.addReview(booking.id, reviewData);
      if (res.success) {
        addToast({ type: "success", message: "Review submitted successfully" });
        setShowReviewModal(false);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      addToast({
        type: "error",
        message: error.message || "Failed to submit review",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await bookingService.completeBooking(booking.id);
      if (res.success) {
        addToast({ type: "success", message: "Booking marked as completed" });
        setIsCompleteModalOpen(false);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error completing booking:", error);
      addToast({ type: "error", message: "Failed to complete booking" });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (providerId) => {
    setLoading(true);
    try {
      // Find quote to get price
      const quote = booking.quotes?.find((q) => q.provider.id === providerId);
      if (quote) setPendingPaymentAmount(quote.price);

      await bookingService.respondToQuote(booking.id, providerId, "accept");
      addToast({
        type: "success",
        message: "Quote accepted! Proceeding to payment.",
      });

      if (onUpdate) onUpdate();

      // Open payment modal immediately
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error("Error accepting quote:", error);
      addToast({ type: "error", message: "Failed to accept quote" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineQuote = async (providerId) => {
    setLoading(true);
    try {
      await bookingService.respondToQuote(booking.id, providerId, "reject");
      addToast({ type: "success", message: "Quote declined." });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error declining quote:", error);
      addToast({ type: "error", message: "Failed to decline quote" });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    addToast({
      type: "success",
      message: "Payment processed successfully!",
    });
    if (onUpdate) onUpdate();
  };

  const handleDownloadInvoice = async () => {
    downloadInvoice(booking.id, booking.reference, (msg, type) =>
      addToast({ type: type || "error", message: msg }),
    );
  };

  const handleContactProvider = () => {
    if (booking.providerPhone) {
      window.open(`tel:${booking.providerPhone}`, "_self");
    } else {
      addToast({
        type: "info",
        message: "Provider phone number not available",
      });
    }
  };

  const currentStatus = booking?.status?.toLowerCase() || "";
  const currentPaymentStatus = booking?.paymentStatus?.toLowerCase() || "";

  const canCancel = [
    "confirmation",
    "accepted",
    "confirmed",
    "pending payment",
    "searching",
    "awaiting-customer-approval",
  ].includes(currentStatus);
  const canPay =
    currentPaymentStatus === "unpaid" &&
    ["accepted", "confirmed", "pending payment"].includes(currentStatus);
  const canComplete = [
    "confirmed",
    "in-progress",
    "completed-by-fitter",
  ].includes(currentStatus);
  const isCompleteEnabled =
    currentStatus === "in-progress" || currentStatus === "completed-by-fitter";
  const canReview =
    (currentStatus === "completed" || booking?.status === "Completed") &&
    (!booking?.rating || !booking?.rating?.score);
  const canDownloadInvoice =
    ["paid", "refunded", "partially_refunded", "partially refunded"].includes(
      currentPaymentStatus,
    ) ||
    currentStatus === "completed" ||
    currentStatus === "completed-by-fitter";
  const isInvoiceEnabled =
    currentStatus === "completed" ||
    currentStatus === "completed-by-fitter" ||
    ["refunded", "partially_refunded", "partially refunded"].includes(
      currentPaymentStatus,
    );

  // Handle initial action (e.g., from deep link)
  useEffect(() => {
    if (isOpen && initialAction) {
      if (initialAction === "review" && canReview) {
        setShowReviewModal(true);
      } else if (initialAction === "acknowledge" && canComplete) {
        setIsCompleteModalOpen(true);
      }
    }
  }, [isOpen, initialAction, canReview, canComplete]);

  if (!booking) return null;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking #${booking.reference}`}
        size="lg"
      >
        <div className="space-y-6 mb-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <StatusBadge
              status={
                booking.status?.toLowerCase() === "searching" &&
                booking.quotes?.length > 0
                  ? "awaiting-customer-approval"
                  : booking.status
              }
              type="booking"
              size="md"
            />
            <StatusBadge
              status={booking.paymentStatus}
              type="payment"
              size="md"
            />
          </div>

          {/* Service Completed Banner inline */}
          {currentStatus === "completed-by-fitter" && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400">
                <CheckCircle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-green-900 dark:text-green-200">
                  Service Completed!
                </h3>
                <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                  The fitter has marked your service as completed. Please review
                  and acknowledge the work to finalize your booking.
                </p>
                <div className="flex gap-4 mt-3">
                  <Button
                    variant="primary"
                    disabled={loading}
                    size="xs"
                    onClick={() => handleComplete()}
                  >
                    {loading ? "Completing..." : "Complete Booking"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Received Quotes Section */}
          {(currentStatus === "awaiting-customer-approval" ||
            currentStatus === "searching") &&
            booking.quotes &&
            booking.quotes.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  Received Quotes ({booking.quotes.length})
                </h4>
                <div className="grid gap-3">
                  {booking.quotes.map((quote) => (
                    <div
                      key={quote.provider.id}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-bold text-sm">
                            {quote.provider.businessName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                              {quote.provider.businessName}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Star
                                size={10}
                                className="text-amber-400 fill-amber-400"
                              />
                              <span>{quote.provider.rating || 5.0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600 dark:text-primary-400">
                            {formatCurrency(quote.price)}
                          </p>
                        </div>
                      </div>

                      {quote.slot && (
                        <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
                          <Clock size={14} className="text-blue-500" />
                          <div>
                            <span className="font-semibold mr-1">
                              Proposed Time:
                            </span>
                            {quote.slot}
                          </div>
                        </div>
                      )}

                      {quote.notes && (
                        <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded text-xs text-slate-600 dark:text-slate-400 italic">
                          "{quote.notes}"
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleDeclineQuote(quote.provider.id)}
                          disabled={loading}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleAcceptQuote(quote.provider.id)}
                          disabled={loading}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Suggested Alternate Slot */}
          {/* Suggested Alternate Slot(s) */}
          {currentStatus === "searching" &&
            (booking.suggestions?.length > 0
              ? booking.suggestions
              : booking.suggestedAlternateSlot
                ? [
                    {
                      providerName: "Provider",
                      slot: booking.suggestedAlternateSlot,
                      note: booking.alternateSlotNote,
                    },
                  ]
                : []
            ).map((suggestion, index) => (
              <div
                key={index}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 mb-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-300">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                      {suggestion.providerName &&
                      suggestion.providerName !== "Provider"
                        ? `${suggestion.providerName} Suggested Alternate Time`
                        : "Provider Suggested Alternate Time"}
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                      Suggested:{" "}
                      <span className="font-bold">{suggestion.slot}</span>
                    </p>
                    {suggestion.note && (
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 italic">
                        "{suggestion.note}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Service Details */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
              Service Details
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Car
                    size={16}
                    className="text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide opacity-70">
                    Selected Services & Glass
                  </p>
                  <div className="space-y-2">
                    {booking.serviceSelections &&
                    booking.serviceSelections.length > 0 ? (
                      booking.serviceSelections.map((selection, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex flex-col p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                              <FileText size={12} />
                            </div>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                              {selection.serviceName}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 ml-7">
                            {selection.glassTypes &&
                            selection.glassTypes.length > 0 ? (
                              selection.glassTypes.map((gt, gIdx) => (
                                <span
                                  key={gIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                >
                                  {gt}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic ml-1">
                                No glass selected
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg shadow-sm">
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {booking.serviceTypes?.join(", ") || booking.service}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {booking.glassTypes?.join(", ") ||
                            booking.glassType ||
                            "-"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Vehicle
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {booking.vehicle}
                    </p>
                    {(booking.vehicleData?.hasAdasCamera ||
                      booking.vehicleData?.hasRainSensor) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {booking.vehicleData?.hasAdasCamera && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                            ADAS Camera
                          </span>
                        )}
                        {booking.vehicleData?.hasRainSensor && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                            Rain Sensor
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <Clock
                      size={16}
                      className="text-primary-600 dark:text-primary-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Date & Time
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {booking.formattedScheduledDateTime ||
                        formatDate(booking.scheduledDate, "datetime")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <MapPin
                      size={16}
                      className="text-primary-600 dark:text-primary-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Location
                    </p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {booking.locationType}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {booking.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
              Booking Progress
            </h4>
            <div className="relative">
              {booking.timeline?.map((step, index) => {
                const isLast = index === booking.timeline.length - 1;
                const isCancelled = step.status === "Cancelled";

                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                        ${
                          step.completed
                            ? isCancelled
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                        }
                      `}
                      >
                        {step.completed ? (
                          step.isRefund ? (
                            <RotateCcw size={14} />
                          ) : isCancelled ? (
                            <X size={14} />
                          ) : (
                            <CheckCircle size={14} />
                          )
                        ) : (
                          <Circle size={14} />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 h-8 ${
                            step.completed
                              ? "bg-green-200 dark:bg-green-900/50"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p
                        className={`text-sm font-medium ${
                          step.completed
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {step.status}
                      </p>
                      {step.date && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatDate(step.date, "datetime")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {!booking.timeline && (
                <p className="text-sm text-slate-400 italic">
                  No progress data available
                </p>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {booking.customerNotes && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30 mb-6">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <MessageSquare size={16} />
                Special Instructions
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {booking.customerNotes}
              </p>
            </div>
          )}

          {/* Uploaded Images */}
          {damageImages.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Uploaded Images
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {damageImages.map((img, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity relative group"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img}
                      alt={`Damage ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.classList.add(
                          "bg-slate-100",
                          "dark:bg-slate-800",
                          "flex",
                          "items-center",
                          "justify-center",
                        );
                        e.target.parentElement.innerHTML =
                          '<span class="text-xs text-slate-400">Error</span>';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Work Images (After) */}
          {booking.afterImages && booking.afterImages.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Completed Work Images
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {booking.afterImages.map((img, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden border border-green-200 dark:border-green-800 cursor-pointer hover:opacity-90 transition-opacity relative group"
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img}
                      alt={`Completion ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.classList.add(
                          "bg-slate-100",
                          "dark:bg-slate-800",
                          "flex",
                          "items-center",
                          "justify-center",
                        );
                        e.target.parentElement.innerHTML =
                          '<span class="text-xs text-slate-400">Error</span>';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider Details */}
          {booking.providerName &&
            currentStatus !== "searching" &&
            currentStatus !== "awaiting-customer-approval" && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Provider
                </h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {booking.providerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {booking.providerName}
                      </p>
                      <Rating
                        value={booking.providerRating || 0}
                        reviewCount={booking.providerReviews || 0}
                        size="sm"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Your Review */}
          {booking.rating?.score && (
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                Your Review
              </h4>
              <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Rating
                    value={booking.rating.score}
                    showCount={false}
                    size="sm"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {booking.rating.ratedAt
                      ? formatDate(booking.rating.ratedAt)
                      : "Just now"}
                  </span>
                </div>
                {booking.rating.review && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                    "{booking.rating.review}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          {currentStatus !== "searching" &&
            currentStatus !== "awaiting-customer-approval" && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Price
                </h4>

                {/* Paystack Refund Notice Banner */}
                {(currentPaymentStatus === "refunded" ||
                  currentPaymentStatus === "partially_refunded" ||
                  currentPaymentStatus === "partially refunded") && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-3">
                    <div className="flex-shrink-0 pt-0.5">
                      <Clock
                        size={18}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      <p className="font-semibold mb-1">About your refund</p>
                      <p>
                        Refunds are processed immediately but may take{" "}
                        <strong>3-12 business days</strong> to reflect in your
                        account depending on your bank.
                      </p>
                      <a
                        href="https://support.paystack.com/en/articles/2127106-initiating-and-completing-a-refund"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 font-semibold underline hover:text-blue-600"
                      >
                        Learn more on Paystack
                      </a>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Service Amount
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-lg">
                      {formatCurrency(booking.price?.total || 0)}
                    </span>
                  </div>

                  {/* Show Refund/Cancellation Breakdown */}
                  {(booking.cancellation?.refundAmount > 0 ||
                    booking.cancellation?.fee > 0 ||
                    currentPaymentStatus === "refunded" ||
                    currentPaymentStatus === "partially_refunded" ||
                    currentPaymentStatus === "partially refunded") && (
                    <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 bg-slate-100/30 dark:bg-slate-900/20 -mx-4 -mb-4 p-4 rounded-b-xl space-y-2">
                      {booking.cancellation?.fee > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Cancellation Fee
                          </span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(booking.cancellation.fee)}
                          </span>
                        </div>
                      )}
                      {(booking.cancellation?.refundAmount > 0 ||
                        currentPaymentStatus === "refunded" ||
                        currentPaymentStatus === "partially_refunded" ||
                        currentPaymentStatus === "partially refunded") && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            {currentPaymentStatus === "partially_refunded" ||
                            currentPaymentStatus === "partially refunded"
                              ? "Partial Refund Processed"
                              : "Refund Processed"}
                            {booking.cancellation?.refundStatus === "pending" &&
                              " (Pending)"}
                          </span>
                          <span className="font-bold text-purple-700 dark:text-purple-400">
                            -{" "}
                            {formatCurrency(
                              booking.cancellation?.refundAmount ||
                                (currentPaymentStatus === "refunded"
                                  ? booking.price?.total
                                  : 0),
                            )}
                          </span>
                        </div>
                      )}

                      {/* Net Total after adjustments */}
                      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Net Total
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(
                            (booking.price?.total || 0) -
                              (booking.cancellation?.refundAmount ||
                                (currentPaymentStatus === "refunded"
                                  ? booking.price?.total
                                  : 0)),
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Actions */}
        {(canPay ||
          canComplete ||
          canReview ||
          canDownloadInvoice ||
          canCancel) && (
          <DrawerFooter className="flex-col gap-3">
            {canPay && (
              <Button onClick={handlePayNow} className="w-full">
                <CreditCard size={16} />
                Confirm & Pay
              </Button>
            )}
            {canComplete && (
              <Tooltip
                className="w-full"
                content={
                  !isCompleteEnabled
                    ? "Technician will notify you when work is ready for inspection"
                    : ""
                }
              >
                <Button
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="w-full"
                  disabled={!isCompleteEnabled}
                >
                  <CheckCircle size={16} />
                  Complete Booking
                </Button>
              </Tooltip>
            )}

            {(canReview || canDownloadInvoice || canCancel) && (
              <div className="grid grid-flow-col auto-cols-fr gap-2 w-full">
                {canReview && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <Star size={16} />
                    Leave Review
                  </Button>
                )}
                {canDownloadInvoice && (
                  <Tooltip
                    className="w-full"
                    content={
                      !isInvoiceEnabled
                        ? "Available once booking is completed"
                        : ""
                    }
                  >
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handleDownloadInvoice}
                      disabled={!isInvoiceEnabled}
                    >
                      <Download size={16} />
                      Invoice
                    </Button>
                  </Tooltip>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 justify-center"
                    onClick={handleOpenCancelModal}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            )}
          </DrawerFooter>
        )}
      </Drawer>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        booking={booking}
        isLoading={reviewLoading}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelQuote(null);
        }}
        onConfirm={handleCancel}
        title="Cancel this booking?"
        message={
          cancelQuoteLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : cancelQuote ? (
            <div className="text-left mt-2">
              <p className="mb-4 text-slate-600 dark:text-slate-300">
                Are you sure you want to cancel this booking?
              </p>

              {cancelQuote.isPaid && (
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Booking Total:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(cancelQuote.bookingTotal)}
                    </span>
                  </div>

                  {cancelQuote.cancellationFee > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>
                        Cancellation Fee
                        {cancelQuote.wasWithinGracePeriod
                          ? ""
                          : " (Outside Grace Period)"}
                        :
                      </span>
                      <span>
                        - {formatCurrency(cancelQuote.cancellationFee)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold">
                    <span
                      className={
                        cancelQuote.refundAmount > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-900 dark:text-slate-100"
                      }
                    >
                      Refund Amount:
                    </span>
                    <span
                      className={
                        cancelQuote.refundAmount > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-900 dark:text-slate-100"
                      }
                    >
                      {formatCurrency(cancelQuote.refundAmount)}
                    </span>
                  </div>

                  {cancelQuote.refundAmount > 0 ? (
                    <p className="text-xs text-slate-500 mt-2 pt-2 text-center italic">
                      Refunds are processed to your original payment method
                      within 3-5 business days.
                    </p>
                  ) : cancelQuote.cancellationFee > 0 ? (
                    <p className="text-xs text-red-500 mt-2 pt-2 text-center italic">
                      No refund available. The cancellation fee equals the full
                      booking amount.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            "Are you sure you want to cancel this booking? Cancellation may be subject to a fee if outside the grace period."
          )
        }
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        type="danger"
        loading={loading || cancelQuoteLoading}
      />

      <PaymentModal
        payment={{
          id: booking.id,
          bookingId: booking.id,
          bookingRef: booking.reference,
          amount: pendingPaymentAmount || booking.price?.total || 0,
          service: booking.service,
          breakdown: {
            service: booking.price?.service || 0,
            callout: booking.price?.callout || 0,
            materials: booking.price?.materials || 0,
          },
        }}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Complete Booking Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete Booking"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20 text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              Finish this job?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please confirm that the technician has completed the work on your{" "}
              {booking.vehicle} to your satisfaction.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Service</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {booking.service}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Paid</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(booking.price?.total || 0)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Once completed, you will be able to leave a review and your invoice
            will be updated.
          </p>
        </div>

        <ModalActions>
          <Button
            variant="secondary"
            onClick={() => setIsCompleteModalOpen(false)}
            disabled={loading}
          >
            Not Yet
          </Button>
          <Button
            onClick={handleComplete}
            loading={loading}
            className="min-w-[140px]"
          >
            Confirm Completion
          </Button>
        </ModalActions>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Image Preview"
        size="xl"
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
        )}
      </Modal>
    </>
  );
};

export default BookingDetailDrawer;
