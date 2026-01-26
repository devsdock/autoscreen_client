import { useState } from "react";
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
} from "lucide-react";
import Drawer, { DrawerFooter } from "../ui/Drawer";
import StatusBadge from "../ui/StatusBadge";
import Rating from "../ui/Rating";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import Modal, { ModalActions } from "../ui/Modal";
import PaymentModal from "./PaymentModal";
import useDashboardStore, {
  formatDate,
  formatCurrency,
} from "../../store/useDashboardStore";
import bookingService from "../../services/bookingService";
import { downloadInvoice } from "../../utils/invoiceUtils";
import { useNavigate } from "react-router-dom";
import ReviewModal from "./ReviewModal";

const BookingDetailDrawer = ({ booking, isOpen, onClose, onUpdate }) => {
  const navigate = useNavigate();
  const { addToast } = useDashboardStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  if (!booking) return null;

  const damageImages =
    booking.damageImages ||
    booking.quote?.damageImages ||
    booking.completionDetails?.beforeImages ||
    [];

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
    downloadInvoice(booking.id, (msg) =>
      addToast({ type: "error", message: msg }),
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

  const currentStatus = booking.status?.toLowerCase() || "";
  const currentPaymentStatus = booking.paymentStatus?.toLowerCase() || "";

  const canCancel = [
    "pending",
    "accepted",
    "confirmed",
    "pending payment",
    "searching",
  ].includes(currentStatus);
  const canPay =
    currentPaymentStatus === "unpaid" &&
    ["accepted", "confirmed", "pending payment"].includes(currentStatus);
  const canComplete = currentStatus === "confirmed";
  const canReview =
    (currentStatus === "completed" || booking.status === "Completed") &&
    (!booking.rating || !booking.rating.score);
  const canDownloadInvoice =
    ["paid", "partially_refunded", "partially refunded"].includes(
      currentPaymentStatus,
    ) || currentStatus === "completed";

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking #${booking.reference}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} type="booking" size="md" />
            <StatusBadge
              status={booking.paymentStatus}
              type="payment"
              size="md"
            />
          </div>

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
                          isCancelled ? (
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

          {/* Booking Details */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
              Service Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                  <Car
                    size={16}
                    className="text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Service
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {booking.service}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {booking.vehicle}
                  </p>
                  {(booking.vehicleData?.hasAdasCamera ||
                    booking.vehicleData?.hasRainSensor) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {booking.vehicleData?.hasAdasCamera && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                          ADAS
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
                    {formatDate(booking.scheduledDate, "datetime")}
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
          {booking.providerName && currentStatus !== "searching" && (
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
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
              Price
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {booking.service}
                </span>
                <span className="font-bold text-primary-600 dark:text-primary-400 text-2xl">
                  {formatCurrency(booking.price?.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <DrawerFooter className="flex-col sm:flex-row gap-2">
          {canPay && (
            <Button onClick={handlePayNow} className="flex-1">
              <CreditCard size={16} />
              Confirm & Pay
            </Button>
          )}
          {canComplete && (
            <Button
              onClick={() => setIsCompleteModalOpen(true)}
              className="flex-1"
            >
              <CheckCircle size={16} />
              Complete Booking
            </Button>
          )}
          {canReview && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowReviewModal(true)}
            >
              <Star size={16} />
              Leave Review
            </Button>
          )}
          {canDownloadInvoice && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleDownloadInvoice}
            >
              <Download size={16} />
              Invoice
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Booking
            </Button>
          )}
        </DrawerFooter>
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
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel this booking?"
        message="Are you sure you want to cancel this booking? Cancellation may be subject to a fee if outside the grace period."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        type="danger"
        loading={loading}
      />

      <PaymentModal
        payment={{
          id: booking.id,
          bookingId: booking.id,
          bookingRef: booking.reference,
          amount: booking.price?.total || 0,
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
