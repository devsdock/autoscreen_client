import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Car,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import useDashboardStore, {
  formatCurrency,
  formatDate,
} from "../../store/useDashboardStore";
import bookingService from "../../services/bookingService";
import Button from "../../components/ui/Button";
import Modal, { ModalActions } from "../../components/ui/Modal";

// Polling interval in milliseconds
const POLL_INTERVAL = 3000;

const BookingSearching = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { addToast, setSearchCriteria } = useDashboardStore();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [searchDots, setSearchDots] = useState(0);

  // Animate the searching dots
  useEffect(() => {
    const interval = setInterval(() => {
      setSearchDots((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Load initial booking data from API
  useEffect(() => {
    const loadBooking = async () => {
      try {
        const response = await bookingService.getBookingStatus(bookingId);
        if (response?.data) {
          const bookingData = response.data;
          setBooking(bookingData);
          setIsLoading(false);

          // If already accepted or beyond, redirect
          if (
            ["accepted", "confirmed", "completed"].includes(bookingData.status)
          ) {
            navigate(`/dashboard/booking/pending/${bookingId}`);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, navigate]);

  // Poll for status updates
  useEffect(() => {
    if (!booking || booking.status !== "searching") return;

    const pollStatus = async () => {
      try {
        const response = await bookingService.getBookingStatus(bookingId);
        const result = response?.data;
        if (result?.status && result.status !== "searching") {
          setBooking((prev) => ({ ...prev, ...result }));

          if (result.status === "accepted") {
            addToast({
              type: "success",
              message: "A provider has accepted your booking!",
            });
            // Navigate to pending page for payment
            navigate(`/dashboard/booking/pending/${bookingId}`);
            addToast({
              type: "warning",
              message: "No providers available. Please try again.",
            });
          } else if (result.status === "awaiting-customer-approval") {
            addToast({ type: "info", message: "You have received quotes!" });
          }
        }
      } catch (error) {}
    };

    const interval = setInterval(pollStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [booking, bookingId, navigate, addToast]);

  const handleModify = () => {
    // Populate store with current booking details so form is pre-filled
    const criteria = {
      vehicleMake: booking.vehicle?.make || "",
      vehicleModel: booking.vehicle?.model || "",
      vehicleYear: (
        booking.vehicle?.year || new Date().getFullYear()
      ).toString(),
      glassTypes:
        booking.glassTypes || (booking.glassType ? [booking.glassType] : []),
      serviceTypes:
        booking.serviceTypes ||
        (booking.serviceType ? [booking.serviceType] : []),
      city: booking.serviceAddress?.city || "",
      postcode: booking.serviceAddress?.postalCode || "",
    };
    setSearchCriteria(criteria);
    navigate("/dashboard/book");
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(bookingId, cancelReason);
      addToast({ type: "info", message: "Booking request cancelled" });
      handleModify(); // This will pre-fill the form and navigate back
    } catch (error) {
      addToast({ type: "error", message: "Failed to cancel request" });
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  // Calculate time remaining for search
  const getTimeRemaining = useCallback(() => {
    if (!booking?.searchSettings?.expiresAt) return null;
    const expiresAt = new Date(booking.searchSettings.expiresAt);
    const now = new Date();
    const diff = expiresAt - now;
    if (diff <= 0) return "Expired";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [booking]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle size={48} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Booking not found
        </h2>
        <Button onClick={() => navigate("/dashboard/bookings")}>
          View All Bookings
        </Button>
      </div>
    );
  }

  const isSearching = booking.status === "searching";
  const isExpired = booking.status === "expired";
  const isCancelled = booking.status === "cancelled";
  const isAwaitingApproval = booking.status === "awaiting-customer-approval";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Status Banner */}
      <div
        className={`rounded-2xl p-8 mb-6 text-center ${
          isSearching
            ? "bg-gradient-to-br from-primary-500 to-primary-600"
            : isExpired
              ? "bg-gradient-to-br from-amber-500 to-orange-500"
              : isAwaitingApproval
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : "bg-gradient-to-br from-slate-500 to-slate-600"
        }`}
      >
        {/* Animated Search Icon */}
        {isSearching && (
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-white/20 animate-ping animation-delay-300" />
            <div className="absolute inset-4 rounded-full bg-white/30 animate-pulse" />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Search size={28} className="text-primary-600" />
              </div>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <Clock size={40} className="text-white" />
          </div>
        )}

        {isCancelled && (
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <XCircle size={40} className="text-white" />
          </div>
        )}

        {isAwaitingApproval && (
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle size={40} className="text-white" />
          </div>
        )}

        <h1 className="text-2xl font-bold text-white mb-2">
          {isSearching && `Searching for providers${".".repeat(searchDots)}`}
          {isExpired && "No Providers Available"}
          {isCancelled && "Request Cancelled"}
          {isAwaitingApproval && "Quotes Received!"}
        </h1>

        <p className="text-white/80 mb-4">
          {isSearching &&
            "We're finding the best available provider in your area"}
          {isExpired &&
            "Unfortunately, no providers accepted your request in time"}
          {isCancelled && "Your booking request has been cancelled"}
          {isAwaitingApproval &&
            "Providers have sent you quotes. Review them to proceed."}
        </p>

        {/* Booking Reference */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white">
          <span className="text-sm opacity-80">Reference:</span>
          <span className="font-mono font-semibold">
            {booking.bookingNumber}
          </span>
        </div>

        {/* Timer */}
        {isSearching && (
          <div className="mt-4 flex items-center justify-center gap-2 text-white/90">
            <Clock size={16} />
            <span>Time remaining: {getTimeRemaining()}</span>
          </div>
        )}
      </div>

      {/* Search Stats */}
      {isSearching && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {booking.searchSettings?.providersNotified || 0}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Providers Notified
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {booking.acceptance?.responseCount || 0}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Responses
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Booking Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Request Details
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Car size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Vehicle
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {typeof booking.vehicle === "string"
                  ? booking.vehicle
                  : booking.vehicle
                    ? `${booking.vehicle.year || ""} ${booking.vehicle.make || ""} ${booking.vehicle.model || ""}`.trim() ||
                      "Not specified"
                    : "Not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Search size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Service
              </p>
              <div>
                <p className="font-medium text-slate-900 dark:text-white capitalize">
                  {(() => {
                    if (
                      Array.isArray(booking.serviceTypes) &&
                      booking.serviceTypes.length > 0
                    )
                      return booking.serviceTypes.join(", ");
                    if (booking.serviceType === "tinting")
                      return "Anti-Smash and Grab Film";
                    if (booking.serviceType === "replacement")
                      return "Glass Replacement";
                    if (booking.serviceType === "repair") return "Glass Repair";
                    return booking.serviceType || "Glass Service";
                  })()}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                  {Array.isArray(booking.glassTypes) &&
                  booking.glassTypes.length > 0
                    ? booking.glassTypes.join(", ").replace(/_/g, " ")
                    : booking.glassType
                      ? booking.glassType.replace(/_/g, " ")
                      : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Preferred Date
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking.scheduledDate
                  ? formatDate(booking.scheduledDate, "long")
                  : "As soon as possible"}
              </p>
              {booking.timeSlot && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {booking.timeSlot}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Location
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking?.address?.line1 ||
                  booking?.serviceAddress?.addressLine1 ||
                  "Address provided"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking?.address?.city || booking?.serviceAddress?.city || ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {isSearching && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
              You can cancel without any fee while we're still searching
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCancelModal(true)}
            >
              <XCircle size={18} />
              Cancel Request
            </Button>
          </>
        )}

        {isExpired && (
          <div className="text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Would you like to try again or modify your request?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleModify}
              >
                Modify Request
              </Button>
              <Button className="flex-1" onClick={handleModify}>
                Try Again
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="text-center">
            <Button onClick={handleModify}>Create New Request</Button>
          </div>
        )}

        {isAwaitingApproval && (
          <div className="text-center space-y-4">
            <Button
              variant="primary"
              className="w-full text-lg py-4"
              onClick={() => navigate(`/dashboard/bookings/${bookingId}`)}
            >
              View Quotes & Booking
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <p className="text-sm text-slate-500">
              See provider offers in your bookings list.
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/bookings")}
          >
            View All Bookings
          </Button>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking Request?"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to cancel this request? Since no provider has
            accepted yet, there's no cancellation fee.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let us know why you're cancelling..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>
        </div>

        <ModalActions>
          <Button
            variant="secondary"
            onClick={() => setShowCancelModal(false)}
            disabled={isCancelling}
          >
            Keep Searching
          </Button>
          <Button
            variant="danger"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Request"
            )}
          </Button>
        </ModalActions>
      </Modal>

      {/* CSS for animation delay */}
      <style>{`
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
};

export default BookingSearching;
