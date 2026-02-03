import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  CreditCard,
  ArrowRight,
  Star,
  MapPin,
  Calendar,
  Car,
  FileText,
  Shield,
  Loader2,
} from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import useDashboardStore, {
  formatCurrency,
  formatDate,
} from "../../store/useDashboardStore";
import bookingService from "../../services/bookingService";
import Button from "../../components/ui/Button";
import PaymentModal from "../../components/dashboard/PaymentModal";

const BookingPending = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useDashboardStore();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingService.getBooking(bookingId);
        setBooking(res.data);
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();

    // Polling while active but not confirmed
    const interval = setInterval(() => {
      const activeStatuses = [
        "searching",
        "awaiting-provider-acceptance",
        "accepted",
        "awaiting-payment",
      ];
      if (activeStatuses.includes(booking?.status)) {
        fetchBooking();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId, booking?.status]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto pb-12 space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Booking not found
        </h2>
        <Button onClick={() => navigate("/dashboard/bookings")}>
          View All Bookings
        </Button>
      </div>
    );
  }

  const handlePaymentSuccess = () => {
    addToast({ type: "success", message: "Payment successful!" });
    navigate(`/dashboard/booking/confirmation/${bookingId}`);
  };

  const rawStatus = booking?.status?.toLowerCase() || "searching";

  // Determine display category
  let statusCategory = "searching";
  if (["accepted", "awaiting-payment"].includes(rawStatus))
    statusCategory = "accepted";
  else if (
    ["confirmed", "paid", "completed", "in-progress"].includes(rawStatus)
  )
    statusCategory = "confirmed";

  const isPending = statusCategory === "searching";
  const isAccepted = statusCategory === "accepted";
  const isConfirmed = statusCategory === "confirmed";

  const statusConfig = {
    searching: {
      icon: Clock,
      title: "Searching for Providers",
      description:
        "Your booking request is being broadcasted to providers in your area.",
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    accepted: {
      icon: CheckCircle,
      title: "Provider Accepted!",
      description:
        "Great news! A provider has accepted your booking. Complete payment to confirm.",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
    confirmed: {
      icon: Shield,
      title: "Booking Confirmed",
      description:
        "Your booking is confirmed. The provider is scheduled for your selected time.",
      color: "text-primary-500",
      bgColor: "bg-primary-50 dark:bg-primary-900/20",
      borderColor: "border-primary-200 dark:border-primary-800",
    },
  };

  const currentStatus = statusConfig[statusCategory] || statusConfig.searching;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Status Banner */}
      <div
        className={`rounded-2xl ${currentStatus.bgColor} border ${currentStatus.borderColor} p-6 mb-6 text-center shadow-sm`}
      >
        <div
          className={`w-16 h-16 ${currentStatus.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <StatusIcon size={32} className={currentStatus.color} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {currentStatus.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {currentStatus.description}
        </p>

        {/* Booking Reference */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-800/50 rounded-full">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Booking Reference:
          </span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">
            {booking.bookingNumber}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Booking Progress
        </h3>
        <div className="space-y-4">
          {booking.statusHistory?.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${index <= 1
                  ? "bg-green-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
              >
                {index <= 1 ? (
                  <CheckCircle size={18} />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${index <= 1
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400"
                    }`}
                >
                  {step.status}
                </p>
                {step.timestamp && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                )}
                {step.note && (
                  <p className="text-xs text-slate-400 italic mt-1">
                    {step.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Service Details
        </h3>

        {/* Provider Info (if accepted) */}
        {(isAccepted || isConfirmed) && booking.provider && (
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
              {booking.provider.businessName?.charAt(0) ||
                booking.provider.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {booking.provider.businessName || booking.provider.name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Star
                  size={14}
                  className="text-amber-400"
                  fill="currentColor"
                />
                <span>{booking.provider.rating} Rating</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Shield size={14} /> Verified
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <FileText size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Service & Glass
              </p>
              <p className="font-medium text-slate-900 dark:text-white capitalize">
                {booking.serviceType}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {booking.glassType?.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Car size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Vehicle
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking.vehicle?.year} {booking.vehicle?.make}{" "}
                {booking.vehicle?.model}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Scheduled Date
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {formatDate(booking.scheduledDate, "long")}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {booking.scheduledTimeSlot}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Service Location
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking.serviceAddress?.addressLine1}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {booking.serviceAddress?.city},{" "}
                {booking.serviceAddress?.postalCode}
              </p>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Price
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatCurrency(booking.price?.total || 0)}
              </p>
            </div>
            {isAccepted && (
              <Button size="lg" onClick={() => setIsPaymentModalOpen(true)}>
                <CreditCard size={18} />
                Confirm & Pay
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Actions / Status Specific Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        {isPending && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <Loader2 className="animate-spin text-amber-500" size={32} />
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Broadcasting Request
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Multiple providers have been notified. We'll alert you as soon
                as someone accepts.
              </p>
            </div>
            <Button
              variant="outline"
              className="text-danger-600 border-danger-200 hover:bg-danger-50"
            >
              Cancel Request
            </Button>
          </div>
        )}

        {isAccepted && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
              <p className="font-medium text-green-800 dark:text-green-300">
                A provider is ready!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Please complete the payment within the next few minutes to
                secure this slot.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                Decline
              </Button>
              <Button
                className="flex-1"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Pay Now
              </Button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Booking Confirmed
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All set! You can view the full details and tracker in your
                bookings list.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/dashboard/bookings")}
            >
              Go to My Bookings
            </Button>
          </div>
        )}

        {/* General Link */}
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/bookings")}
          >
            View All Bookings
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        payment={
          booking
            ? {
              id: booking._id || bookingId,
              bookingId: booking._id || bookingId,
              bookingRef: booking.bookingNumber,
              amount: booking.price?.total || 0,
              service: `${booking.serviceType} - ${booking.glassType}`,
              breakdown: {
                service: booking.price?.subtotal || 0,
                callout: 0,
                materials: 0,
              },
            }
            : null
        }
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default BookingPending;
