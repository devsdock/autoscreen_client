import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Star,
  MapPin,
  Calendar,
  Car,
  FileText,
  Download,
  ArrowRight,
  Phone,
  MessageSquare,
  Clock,
  Shield,
} from "lucide-react";
import useDashboardStore, {
  formatCurrency,
  formatDate,
} from "../../store/useDashboardStore";
import Button from "../../components/ui/Button";

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { getBookingById, getProviderById } = useDashboardStore();

  const booking = getBookingById(bookingId);
  const provider = booking ? getProviderById(booking.providerId) : null;

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Banner */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white mb-6">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-green-100 mb-4">
          Your booking has been successfully confirmed. We've sent the details
          to your email.
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 rounded-full backdrop-blur-sm">
          <span className="text-green-100">Booking Reference:</span>
          <span className="font-mono font-bold text-lg">
            {booking.reference}
          </span>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock size={20} className="text-primary-600 dark:text-primary-400" />
          What's Next?
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
              1
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Confirmation Email
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You'll receive an email with all booking details and provider
                contact info.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
              2
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Provider Contact
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The provider may contact you to confirm appointment details.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
              3
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Service Day
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                On the scheduled date, the provider will arrive at your location
                to complete the service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Booking Summary
        </h3>

        {/* Provider Card */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
            {booking.providerName?.charAt(0) || "P"}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              {booking.providerName}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Star size={14} className="text-amber-400" fill="currentColor" />
              {booking.providerRating} ({booking.providerReviews} reviews)
            </div>
          </div>
          {provider?.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
            >
              <Phone size={20} />
            </a>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <FileText size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Service
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking.service?.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.glassType}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Car size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vehicle
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking.vehicle?.year} {booking.vehicle?.make}{" "}
                {booking.vehicle?.model}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Calendar size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Date & Time
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {formatDate(booking.scheduledDate, "long")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.timeSlot}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <MapPin size={18} className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Service Location
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {booking.address?.line1}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {booking.address?.city} {booking.address?.postcode}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900 dark:text-white">
              Amount Paid
            </span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(booking.price?.total || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => {
            // Stub for download receipt
            alert("Receipt download coming soon!");
          }}
        >
          <Download size={18} />
          Download Receipt
        </Button>
        <Button
          className="flex-1"
          onClick={() => navigate("/dashboard/bookings")}
        >
          View All Bookings
          <ArrowRight size={18} />
        </Button>
      </div>

      {/* Back to Dashboard */}
      <div className="text-center mt-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
