import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Calendar,
  FileText,
  Car,
  Clock,
} from "lucide-react";
import useDashboardStore, {
  formatCurrency,
  formatDate,
} from "../../store/useDashboardStore";
import dashboardService from "../../services/dashboardService";
import { mapDashboardData } from "../../utils/dataMappers";
import StatusBadge from "../../components/ui/StatusBadge";
import BookingDetailDrawer from "../../components/dashboard/BookingDetailDrawer";

// Time-of-day greeting
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const OverviewNew = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const {
    user: storeUser,
    bookings: storeBookings,
    quotes: storeQuotes,
    updateUser,
    setVehicles,
    setAddresses,
    setBookings,
    setQuotes,
    addToast,
  } = useDashboardStore();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardService.getDashboard();
      if (response?.success && response?.data) {
        const mappedData = mapDashboardData(response.data);
        setApiData(mappedData);
        if (mappedData?.user) {
          updateUser(mappedData.user);
          if (mappedData.user.vehicles?.length > 0)
            setVehicles(mappedData.user.vehicles);
          if (mappedData.user.addresses?.length > 0)
            setAddresses(mappedData.user.addresses);
        }
        if (mappedData?.recentBookings) setBookings(mappedData.recentBookings);
        if (mappedData?.recentQuotes) setQuotes(mappedData.recentQuotes);
      }
    } catch {
      // Falls back to store data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const user = apiData?.user || storeUser;
  const bookings =
    storeBookings.length > 0 ? storeBookings : apiData?.recentBookings || [];
  const quotes =
    storeQuotes.length > 0 ? storeQuotes : apiData?.recentQuotes || [];
  const stats = apiData?.stats || {
    activeQuotes: 0,
    upcomingBookings: 0,
    completedJobs: 0,
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  // Active quotes with responses
  const activeQuotes = quotes.filter(
    (q) =>
      q.status === "Open" ||
      q.status === "Responses" ||
      q.status === "Pending" ||
      q.status === "pending",
  );

  // Quotes that received responses
  const quotesWithResponses = quotes.filter(
    (q) => q.status === "Responses" || q.status === "Received Responses",
  );

  // Upcoming bookings (confirmed, in-progress, awaiting-payment)
  const upcomingBookings = bookings.filter((b) => {
    const s = b.status?.toLowerCase();
    return (
      s === "confirmed" ||
      s === "in-progress" ||
      s === "accepted" ||
      s === "awaiting-payment"
    );
  });

  const vehicleCount = user?.vehicles?.length || 0;

  // Loading skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-7">
      {/* ── Hero CTA ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-800 to-primary-900 dark:from-primary-900 dark:to-slate-900 py-8 px-10">
        {/* Decorative circles */}
        <div className="absolute -right-[60px] -top-[60px] w-[240px] h-[240px] rounded-full bg-white/[.04]" />
        <div className="absolute right-[80px] -bottom-[80px] w-[180px] h-[180px] rounded-full bg-white/[.03]" />

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <p className="text-[13px] font-semibold text-white/60 uppercase tracking-[.07em] mb-2">
              {getGreeting()}, {firstName}
            </p>
            <h1 className="font-display text-[1.625rem] font-extrabold text-white leading-[1.2] tracking-[-0.02em] mb-[.625rem]">
              Cracked screen?
              <br />
              We've got you covered.
            </h1>
            <p className="text-[15px] text-white/65 leading-[1.5]">
              Get quotes from verified providers in minutes. No call centres, no
              hassle.
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={() => navigate("/dashboard/quotes/new")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-primary-700 font-bold text-[15px] shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
              >
                <Plus size={16} />
                Get a Quote
              </button>
              <button
                onClick={() => navigate("/dashboard/bookings")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[.12] text-white font-bold text-[15px] border border-white/20 hover:bg-white/[.18] transition-all duration-200"
              >
                <Calendar size={16} />
                My Bookings
              </button>
            </div>
          </div>

          {/* Hero visual — hidden on mobile */}
          <div className="hidden md:flex flex-shrink-0 w-[120px] h-[120px] bg-white/[.08] rounded-3xl items-center justify-center">
            <svg
              className="w-[60px] h-[60px] text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8c0-.6.2-1.1.6-1.5l3.8-3.8c.4-.4.9-.7 1.5-.7h4.2c.6 0 1.1.2 1.5.6l3.8 3.8c.4.4.6.9.6 1.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
              <path d="M8 4v4h8V4" />
              <path
                d="M12 9L10 13l4 2-3 4 5-6-4-1 2-3h-2Z"
                fill="rgba(255,255,255,.3)"
                stroke="none"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard
          icon={<FileText size={20} />}
          iconBg="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          value={stats.activeQuotes || activeQuotes.length}
          label="Active Requests"
        />
        <StatCard
          icon={<Clock size={20} />}
          iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          value={quotesWithResponses.length}
          label="Quotes Received"
        />
        <StatCard
          icon={<Calendar size={20} />}
          iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          value={stats.upcomingBookings || upcomingBookings.length}
          label="Upcoming Bookings"
        />
        <StatCard
          icon={<Car size={20} />}
          iconBg="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          value={vehicleCount}
          label="Vehicles Saved"
        />
      </div>

      {/* ── Active Quote Requests ── */}
      {activeQuotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-[17px] font-bold text-slate-900 dark:text-white">
              Active Quote Requests
            </h2>
            <button
              onClick={() => navigate("/dashboard/quotes")}
              className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              View all &rarr;
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {activeQuotes.slice(0, 3).map((quote) => (
              <QuoteMiniCard
                key={quote.id}
                quote={quote}
                onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming Appointments ── */}
      {upcomingBookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-[17px] font-bold text-slate-900 dark:text-white">
              Upcoming Appointments
            </h2>
            <button
              onClick={() => navigate("/dashboard/bookings")}
              className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              View all &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingBookings.slice(0, 4).map((booking) => (
              <BookingMiniCard
                key={booking.id}
                booking={booking}
                onClick={() => setSelectedBooking(booking)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdate={fetchData}
      />
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ icon, iconBg, value, label }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
    <div
      className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center mb-3.5 ${iconBg}`}
    >
      {icon}
    </div>
    <div className="font-display text-[1.75rem] font-extrabold text-slate-900 dark:text-white leading-none tracking-[-0.02em]">
      {value}
    </div>
    <div className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1.5">
      {label}
    </div>
  </div>
);

/* ─── Quote Mini Card (req-mini from HTML) ─── */
const QuoteMiniCard = ({ quote, onClick }) => {
  const vehicle = quote.vehicle;
  const vehicleName =
    typeof vehicle === "object" && vehicle
      ? `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.trim()
      : vehicle || "Unknown Vehicle";

  const regPlate = vehicle?.registrationNumber || vehicle?.regNumber || "";
  const serviceType =
    typeof quote.service === "object" && quote.service
      ? quote.service.name
      : quote.service || quote.serviceType || "";

  const responseCount = quote.responses?.length || quote.responseCount || 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-[1.125rem] shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl flex-shrink-0 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center">
        <FileText size={20} className="text-primary-600 dark:text-primary-400" />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="font-display text-[15px] font-bold text-slate-900 dark:text-white truncate">
          {vehicleName}
        </div>
        <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {regPlate && (
            <span className="font-mono text-sm font-medium text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-[.625rem] py-[.2rem] rounded-lg border border-slate-200 dark:border-slate-700 mr-2">
              {regPlate}
            </span>
          )}
          {serviceType}
        </div>
      </div>

      {/* Quote count */}
      {responseCount > 0 && (
        <div className="text-right flex-shrink-0">
          <div className="font-display text-[1.125rem] font-extrabold text-primary-700 dark:text-primary-400">
            {responseCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            quotes in
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Booking Mini Card (booking-mini from HTML) ─── */
const BookingMiniCard = ({ booking, onClick }) => {
  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate)
    : null;
  const day = scheduledDate ? String(scheduledDate.getDate()).padStart(2, "0") : "--";
  const month = scheduledDate
    ? scheduledDate.toLocaleDateString("en-ZA", { month: "short" }).toUpperCase()
    : "---";

  const serviceName =
    typeof booking.service === "object" && booking.service
      ? booking.service.name
      : booking.service || "General Service";

  const vehicleText =
    typeof booking.vehicle === "object" && booking.vehicle
      ? `${booking.vehicle.year || ""} ${booking.vehicle.make || ""} ${booking.vehicle.model || ""}`.trim()
      : booking.vehicle || "";

  const regPlate =
    booking.vehicle?.registrationNumber || booking.vehicle?.regNumber || "";

  const providerName = booking.providerName || "Unassigned";
  const timeSlot = booking.timeSlot || booking.formattedScheduledTime || "";

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200"
    >
      {/* Top */}
      <div className="py-[1.125rem] px-5 flex gap-4 items-start">
        {/* Date box */}
        <div className="w-[52px] flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg py-2 px-1 text-center" style={{ boxShadow: "0 4px 14px rgba(37,99,235,.25)" }}>
          <div className="font-display text-[1.375rem] font-extrabold text-white leading-none">
            {day}
          </div>
          <div className="text-[10px] font-semibold text-white/75 uppercase tracking-[.04em] mt-0.5">
            {month}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-display text-[15px] font-bold text-slate-900 dark:text-white truncate">
            {serviceName}
          </div>
          <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {vehicleText}
            {regPlate && (
              <>
                {" · "}
                <span className="font-mono text-sm font-medium text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-[.625rem] py-[.2rem] rounded-lg border border-slate-200 dark:border-slate-700">
                  {regPlate}
                </span>
              </>
            )}
          </div>
          <div className="text-[13px] text-slate-600 dark:text-slate-400 font-medium mt-1">
            {providerName}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {timeSlot && (
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            <Clock size={13} className="text-slate-400 dark:text-slate-500" />
            {timeSlot}
          </div>
        )}
        {!timeSlot && <div />}
        <StatusBadge status={booking.status} type="booking" size="xs" />
      </div>
    </div>
  );
};

/* ─── Dashboard Loading Skeleton ─── */
const DashboardSkeleton = () => {
  const shimmer =
    "bg-slate-200 dark:bg-slate-800 rounded animate-pulse";

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className={`${shimmer} h-[220px] rounded-3xl`} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
          >
            <div className={`${shimmer} w-10 h-10 rounded-xl mb-3`} />
            <div className={`${shimmer} h-8 w-12 mb-2`} />
            <div className={`${shimmer} h-3 w-24`} />
          </div>
        ))}
      </div>

      {/* Active Requests */}
      <div>
        <div className="flex justify-between mb-4">
          <div className={`${shimmer} h-5 w-40`} />
          <div className={`${shimmer} h-4 w-16`} />
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-3"
          >
            <div className={`${shimmer} h-5 w-48`} />
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex justify-between mb-4">
          <div className={`${shimmer} h-5 w-44`} />
          <div className={`${shimmer} h-4 w-16`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-[140px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewNew;
