import { useState, useEffect } from "react";
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
  ArrowRight,
  Loader2,
  RefreshCw,
  XCircle,
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
import SelectSlotModal from "./SelectSlotModal";

const QuoteDetailPanel = ({ quote, onClose }) => {
  const navigate = useNavigate();
  const {
    quoteResponses,
    acceptQuote,
    closeQuoteRequest,
    addToast,
    fetchQuoteDetails,
    acceptProposedSlot,
    rejectProposedSlot,
    counterProposeSlot,
  } = useDashboardStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [slotModal, setSlotModal] = useState({
    open: false,
    response: null,
  });
  const [counterSlotModal, setCounterSlotModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSlotAction, setIsSlotAction] = useState(false);

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
    quote.status === "Accepted" || quote.status?.toLowerCase() === "accepted";
  const isClosed =
    quote.status === "Closed" ||
    ["closed", "expired", "cancelled"].includes(quote.status?.toLowerCase());

  const handleAcceptQuote = async (slotData) => {
    if (!slotModal.response) return;

    setIsAccepting(true);

    try {
      const bookingId = await acceptQuote(
        quote.id,
        slotModal.response.id,
        slotData,
      );

      setIsAccepting(false);
      setSlotModal({ open: false, response: null });

      addToast({
        type: "success",
        message:
          "Quote accepted! Waiting for the provider to confirm your time slot.",
      });
      // Stay on quotes page — booking is awaiting-provider-acceptance
      // Refresh quote details to show the updated status
      if (quote?.id) {
        fetchQuoteDetails(quote.id);
      }
    } catch (error) {
      console.error("Accept quote error:", error);
      setIsAccepting(false);
      setSlotModal({ open: false, response: null });
    }
  };

  // Slot negotiation handlers
  const booking = quote?.booking;
  const negotiation = booking?.slotNegotiation;
  const isProviderProposed = negotiation?.status === "provider-proposed";

  const handleAcceptSlot = async () => {
    if (!booking?._id) return;
    setIsSlotAction(true);
    try {
      const result = await acceptProposedSlot(booking._id);
      if (result) {
        addToast({
          type: "success",
          message: "Time slot accepted! Booking confirmed.",
        });
        fetchQuoteDetails(quote.id);
      }
    } catch (err) {
      console.error("Accept slot error:", err);
    } finally {
      setIsSlotAction(false);
    }
  };

  const handleRejectSlot = async () => {
    if (!booking?._id) return;
    setIsSlotAction(true);
    try {
      const result = await rejectProposedSlot(booking._id);
      if (result) {
        addToast({
          type: "info",
          message: "Booking cancelled.",
        });
        fetchQuoteDetails(quote.id);
      }
    } catch (err) {
      console.error("Reject slot error:", err);
    } finally {
      setIsSlotAction(false);
    }
  };

  const handleCounterSlot = async (slotData) => {
    if (!booking?._id) return;
    setIsSlotAction(true);
    try {
      const result = await counterProposeSlot(booking._id, slotData);
      if (result) {
        addToast({
          type: "success",
          message: "Your preferred time has been sent to the provider.",
        });
        setCounterSlotModal(false);
        fetchQuoteDetails(quote.id);
      }
    } catch (err) {
      console.error("Counter slot error:", err);
    } finally {
      setIsSlotAction(false);
    }
  };

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
    const status = quote.status?.toLowerCase() || "";

    if (["open", "pending"].includes(status)) {
      return "Your quote request is live. Providers in your area will start responding soon.";
    }
    if (["responses", "quoted", "received responses"].includes(status)) {
      return "Providers have responded! Review the offers below and accept one to proceed.";
    }
    if (status === "accepted") {
      if (booking?.status === "awaiting-provider-acceptance") {
        return "You've accepted a quote. Waiting for the provider to confirm your time slot.";
      }
      return "You've accepted a quote. Your booking has been confirmed.";
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Quote Reference
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {quote.reference}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={quote.status} type="quote" />
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Explanation */}
        <div
          className={`p-4 rounded-xl flex items-start gap-3 ${
            ["Open", "Pending", "pending"].includes(quote.status)
              ? "bg-primary-50 dark:bg-primary-900/20"
              : [
                    "Responses",
                    "quoted",
                    "Quoted",
                    "Received Responses",
                  ].includes(quote.status)
                ? "bg-warning-50 dark:bg-warning-900/20"
                : quote.status === "Accepted"
                  ? "bg-success-50 dark:bg-success-900/20"
                  : "bg-slate-50 dark:bg-slate-800"
          }`}
        >
          {["Open", "Pending", "pending"].includes(quote.status) && (
            <Clock
              size={20}
              className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
            />
          )}
          {["Responses", "quoted", "Quoted", "Received Responses"].includes(
            quote.status,
          ) && (
            <AlertCircle
              size={20}
              className="text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5"
            />
          )}
          {quote.status === "Accepted" && (
            <CheckCircle2
              size={20}
              className="text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5"
            />
          )}
          {quote.status === "Closed" && (
            <X
              size={20}
              className="text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5"
            />
          )}
          <p
            className={`text-sm ${
              ["Open", "Pending", "pending"].includes(quote.status)
                ? "text-primary-700 dark:text-primary-300"
                : [
                      "Responses",
                      "quoted",
                      "Quoted",
                      "Received Responses",
                    ].includes(quote.status)
                  ? "text-warning-700 dark:text-warning-300"
                  : quote.status === "Accepted"
                    ? "text-success-700 dark:text-success-300"
                    : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {getStatusExplanation()}
          </p>
        </div>

        {/* Next Step Banner for Accepted — only show once provider confirms slot */}
        {isAccepted &&
          !isProviderProposed &&
          booking?.status &&
          booking.status !== "awaiting-provider-acceptance" && (
            <div className="p-4 bg-primary-600 dark:bg-primary-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Next Step
                  </p>
                  <p className="text-white font-semibold">
                    Complete your booking
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="bg-white hover:bg-slate-100 text-primary-600"
                  onClick={() => navigate("/dashboard/bookings")}
                >
                  View Booking
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

        {/* Awaiting Provider Confirmation Banner */}
        {isAccepted &&
          !isProviderProposed &&
          booking?.status === "awaiting-provider-acceptance" && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock
                  size={20}
                  className="text-amber-600 dark:text-amber-400 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Waiting for Provider Confirmation
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    The provider is reviewing your selected time slot. You'll be
                    notified once they confirm.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Provider Proposed Slot Banner */}
        {isAccepted && isProviderProposed && (
          <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw
                size={18}
                className="text-warning-600 dark:text-warning-400"
              />
              <h4 className="font-semibold text-warning-800 dark:text-warning-200">
                Provider Suggested a Different Time
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Your selected time
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {booking?.scheduledDate
                    ? formatDate(booking.scheduledDate)
                    : "-"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {typeof booking?.scheduledTimeSlot === "object"
                    ? `${booking.scheduledTimeSlot.start} - ${booking.scheduledTimeSlot.end}`
                    : booking?.scheduledTimeSlot || "-"}
                </p>
              </div>
              <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">
                  Provider's preferred time
                </p>
                <p className="font-semibold text-primary-800 dark:text-primary-200">
                  {negotiation?.proposedDate
                    ? formatDate(negotiation.proposedDate)
                    : "-"}
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400">
                  {typeof negotiation?.proposedTimeSlot === "object"
                    ? `${negotiation.proposedTimeSlot.start} - ${negotiation.proposedTimeSlot.end}`
                    : negotiation?.proposedTimeSlot || "-"}
                </p>
              </div>
            </div>
            {negotiation?.note && (
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                "{negotiation.note}"
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleAcceptSlot}
                loading={isSlotAction}
                className="flex-1"
              >
                <CheckCircle2 size={14} className="mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCounterSlotModal(true)}
                disabled={isSlotAction}
                className="flex-1"
              >
                <RefreshCw size={14} className="mr-1" />
                Change Time
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleRejectSlot}
                loading={isSlotAction}
                className="flex-1"
              >
                <XCircle size={14} className="mr-1" />
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Quote Summary Card */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Quote Details
          </h3>

          {/* Vehicle */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Car size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800 flex-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide opacity-70">
                Vehicle
              </p>
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                {typeof quote.vehicle === "object"
                  ? `${quote.vehicle.year || ""} ${quote.vehicle.make || ""} ${
                      quote.vehicle.model || ""
                    }`.trim() || "Unknown Vehicle"
                  : quote.vehicle || "Unknown Vehicle"}
              </p>
              {(quote.vehicleData?.hasAdasCamera ||
                quote.vehicleData?.hasRainSensor) && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {quote.vehicleData?.hasAdasCamera && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                      ADAS Camera
                    </span>
                  )}
                  {quote.vehicleData?.hasRainSensor && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                      Rain Sensor
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Service */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Wrench
                size={16}
                className="text-slate-500 dark:text-slate-400"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide opacity-70">
                Selected Services & Glass
              </p>
              <div className="space-y-2">
                {quote.serviceSelections &&
                quote.serviceSelections.length > 0 ? (
                  quote.serviceSelections.map((selection, sIdx) => (
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
                      {Array.isArray(quote.serviceTypes)
                        ? quote.serviceTypes.join(", ")
                        : quote.serviceType}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {Array.isArray(quote.glassTypes)
                        ? quote.glassTypes.join(", ")
                        : quote.glassType || "-"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <MapPin
                size={16}
                className="text-slate-500 dark:text-slate-400"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Location
              </p>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {quote.location.addressLine1
                  ? `${quote.location.addressLine1}, `
                  : ""}
                {quote.location.city}
                {quote.location.postcode && `, ${quote.location.postcode}`}
              </p>
            </div>
          </div>

          {/* Preferred Date */}
          {quote.preferredDate && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Calendar
                  size={16}
                  className="text-slate-500 dark:text-slate-400"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preferred Date & Time
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(quote.preferredDate)} ·{" "}
                  {quote.preferredTimeSlot || "Any time"}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Additional Notes
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {quote.notes}
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Images */}
        {quote.images && quote.images.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              <ImageIcon size={16} className="inline mr-2" />
              Photos ({quote.images.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {quote.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
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
          </div>
        )}

        {/* Provider Responses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Provider Responses{" "}
              {responses.length > 0 && `(${responses.length})`}
            </h3>
          </div>

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
              {responses.map((response) => (
                <ProviderResponseCard
                  key={response.id}
                  response={response}
                  isAccepted={response.status === "Accepted"}
                  isRejected={response.status === "Rejected"}
                  disabled={isAccepted || isClosed}
                  onAccept={() => setSlotModal({ open: true, response })}
                  onMessage={handleMessageProvider}
                />
              ))}
            </div>
          )}
        </div>

        {/* Management Actions / Danger Zone */}
        {(quote.status?.toLowerCase() === "open" ||
          quote.status?.toLowerCase() === "pending" ||
          quote.status?.toLowerCase() === "quoted" ||
          quote.status?.toLowerCase() === "responses") && (
          <div className="pt-10 flex flex-col items-center justify-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-8" />

            <button
              onClick={() => setCloseModal(true)}
              className="group relative flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:border-danger-200 dark:hover:border-danger-900/50 hover:bg-danger-50/30 dark:hover:bg-danger-900/10 transition-all duration-300 shadow-sm hover:shadow-danger-100/20"
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-danger-100 dark:group-hover:bg-danger-900/30 transition-colors">
                <X
                  size={12}
                  className="group-hover:scale-110 transition-transform"
                />
              </div>
              Close Quote Request
            </button>
          </div>
        )}

        {/* Request Date */}
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Requested on {formatDate(quote.createdAt, "long")}
        </p>
      </div>

      {/* Select Slot Modal (replaces simple accept confirm) */}
      <SelectSlotModal
        isOpen={slotModal.open}
        onClose={() => setSlotModal({ open: false, response: null })}
        onConfirm={handleAcceptQuote}
        provider={
          slotModal.response
            ? {
                id:
                  typeof slotModal.response.provider === "string"
                    ? slotModal.response.provider
                    : slotModal.response.provider?._id ||
                      slotModal.response.provider?.id,
                name:
                  slotModal.response.provider?.businessName ||
                  slotModal.response.provider?.name,
                price: slotModal.response.price,
                turnaround: slotModal.response.turnaround,
              }
            : null
        }
        isLoading={isAccepting}
      />

      {/* Counter-propose Slot Modal */}
      <SelectSlotModal
        isOpen={counterSlotModal}
        onClose={() => setCounterSlotModal(false)}
        onConfirm={handleCounterSlot}
        provider={
          booking?.provider
            ? {
                id: booking.provider,
                name: "Provider",
              }
            : null
        }
        isLoading={isSlotAction}
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
