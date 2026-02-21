import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronDown,
  Calendar,
  Truck,
  MapPin,
  Clock,
  MoreVertical,
  User,
  Package,
  CreditCard,
  CheckCircle,
  Circle,
  Loader2,
  Eye,
  XCircle,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { DashboardSkeleton } from "../../components/skeletons/DashboardSkeleton";
import useDashboardStore, {
  formatCurrency,
  formatDate,
} from "../../store/useDashboardStore";
import dashboardService from "../../services/dashboardService";
import bookingService from "../../services/bookingService";
import { mapDashboardData } from "../../utils/dataMappers";
import StatusBadge from "../../components/ui/StatusBadge";
import Button from "../../components/ui/Button";
import RequestQuoteModal from "../../components/dashboard/RequestQuoteModal";
import BookingDetailDrawer from "../../components/dashboard/BookingDetailDrawer";

const Overview = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [timeRange, setTimeRange] = useState("all"); // 'all', 'day', 'week', 'month'
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const menuRef = useRef(null);
  const timeRangeRef = useRef(null);

  const [showBanner, setShowBanner] = useState(false);
  // Toggle to show/hide timeline - set to true to show booking progress
  const SHOW_TIMELINE = true;

  const {
    user: storeUser,
    bookings: storeBookings,
    quotes: storeQuotes,
    getNextUpcomingBooking,
    updateUser,
    setVehicles,
    setAddresses,
  } = useDashboardStore();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await dashboardService.getDashboard();
      if (response?.success && response?.data) {
        // Map API data to frontend format
        const mappedData = mapDashboardData(response.data);
        setApiData(mappedData);
        // Update store with user data
        if (mappedData?.user) {
          updateUser(mappedData.user);
          // Sync vehicles and addresses from the mapped user object
          if (mappedData.user.vehicles?.length > 0) {
            setVehicles(mappedData.user.vehicles);
          }
          if (mappedData.user.addresses?.length > 0) {
            setAddresses(mappedData.user.addresses);
          }
        }
      }
    } catch (err) {
      setError(err?.message || "Failed to load dashboard data");
      // Will fall back to store data
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dashboard data from API on mount
  useEffect(() => {
    fetchData();
  }, [updateUser]);

  // Use API data if available, otherwise fall back to store
  const user = apiData?.user || storeUser;
  const bookings =
    apiData?.recentBookings || (isLoading ? [] : apiData ? [] : storeBookings);
  const quotes =
    apiData?.recentQuotes || (isLoading ? [] : apiData ? [] : storeQuotes);
  const stats = apiData?.stats || {
    activeQuotes: 0,
    upcomingBookings: 0,
    completedJobs: 0,
    pendingPaymentsCount: 0,
    pendingPaymentsTotal: 0,
  };

  const nextBooking = apiData?.nextBooking;
  const latestBooking = bookings[0];

  useEffect(() => {
    const serviceCompletedCount = bookings.filter((b) => {
      const s = b.status?.toLowerCase();
      return s === "completed-by-fitter";
    }).length;

    // We can use a different key for this banner if we want it to be dismissible separately
    const isDismissed =
      sessionStorage.getItem("complete_banner_dismissed") === "true";
    if (!isDismissed && serviceCompletedCount > 0) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [bookings]);

  // Get filtered date range text and logic
  const getFilterData = () => {
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);
    let label = "Filter";

    if (timeRange === "all") {
      return {
        dateText: "All History",
        label: "All Time",
        startDate: null,
        endDate: null,
      };
    }

    if (timeRange === "day") {
      label = "Today";
      endDate.setDate(today.getDate() + 1);
    } else if (timeRange === "week") {
      label = "Week";
      endDate.setDate(today.getDate() + 7);
    } else if (timeRange === "month") {
      label = "Month";
      endDate.setMonth(today.getMonth() + 1);
    }

    const dateText = `${today.getDate().toString().padStart(2, "0")} - ${endDate.getDate().toString().padStart(2, "0")} ${endDate.toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}`;

    return { dateText, label, startDate, endDate };
  };

  const { dateText: dateRangeText, label: timeRangeLabel } = getFilterData();

  const tabs = [
    { id: "all", label: "All Status" },
    { id: "complete", label: "Complete" },
    { id: "in-transit", label: "In Progress" },
    { id: "processing", label: "Pending" },
  ];

  const filteredBookings = bookings.filter((booking) => {
    // 1. Tab/Status filter
    let statusMatch = true;
    if (activeTab === "complete")
      statusMatch =
        booking.status === "Completed" || booking.status === "completed";
    else if (activeTab === "in-transit")
      statusMatch =
        booking.status === "Confirmed" ||
        booking.status === "In Progress" ||
        booking.status === "in-progress" ||
        booking.status === "searching";
    else if (activeTab === "processing")
      statusMatch =
        booking.status === "Pending" || booking.status === "pending";

    if (!statusMatch) return false;

    // 2. Date/TimeRange filter
    if (timeRange === "all") return true;

    const bookingDate = new Date(booking.scheduledDate);
    const { startDate, endDate } = getFilterData();

    // Set hours to 0 for date comparison
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (bookingDate < start || bookingDate > end) return false;

    return true;
  });

  const handleRequestModalClose = (newQuoteId) => {
    setShowRequestModal(false);
    if (newQuoteId) {
      // If a quote was created, redirect to the new quote's details
      navigate(`/dashboard/quotes/${newQuoteId}`);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        const response = await bookingService.cancelBooking(
          bookingId,
          "Cancelled from dashboard history",
        );
        if (response.success) {
          alert("Booking cancelled successfully");
          // Refresh dashboard data without reload
          fetchData();
        }
      } catch (err) {
        alert(err.message || "Failed to cancel booking");
      }
    }
    setActiveMenuId(null);
  };

  const handleViewBooking = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
    }
    setActiveMenuId(null);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking the toggle button itself
      if (event.target.closest(".kebab-toggle")) return;
      if (event.target.closest(".timerange-toggle")) return;

      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
      if (
        timeRangeRef.current &&
        !timeRangeRef.current.contains(event.target)
      ) {
        setShowTimeRangeDropdown(false);
      }
    };

    if (activeMenuId || showTimeRangeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId, showTimeRangeDropdown]);

  // Show loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {user?.name
              ? `Welcome back, ${user.name.split(" ")[0]}!`
              : "Dashboard"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Here is what's happening today
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="relative" ref={timeRangeRef}>
              <button
                onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
                className="timerange-toggle flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {timeRangeLabel}
                <ChevronDown size={16} />
              </button>
              {showTimeRangeDropdown && (
                <div className="absolute left-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                  {["all", "day", "week", "month"].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range);
                        setShowTimeRangeDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors capitalize"
                    >
                      {range === "all" ? "All Time" : range}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <Calendar
                size={16}
                className="text-slate-400 dark:text-slate-500"
              />
              {dateRangeText}
            </button>
          </div>
        </div>

        <Button onClick={() => setShowRequestModal(true)}>
          <Plus size={18} />
          Request a Quote
        </Button>
      </div>

      {/* Service Completed Banner */}
      {showBanner && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-green-900 dark:text-green-200">
              Service Completed!
            </h3>
            <p className="text-xs text-green-800 dark:text-green-300 mt-1">
              The fitter has marked your service as completed. Please review and
              acknowledge the work to finalize your booking.
            </p>
            <div className="flex gap-4 mt-3">
              <Button
                variant="primary"
                size="xs"
                onClick={() =>
                  navigate("/dashboard/bookings?tab=action-required")
                }
              >
                View & Complete
              </Button>
              <button
                onClick={() => {
                  setShowBanner(false);
                  sessionStorage.setItem("complete_banner_dismissed", "true");
                }}
                className="text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Booking Card */}
      {latestBooking && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left - Booking Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Booking ID
                  </p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                    №{" "}
                    {latestBooking.reference
                      ? `BK-${latestBooking.reference.replace(/^BK-?/i, "")}`
                      : "Pending"}
                  </p>
                </div>
              </div>

              {/* Info Pills */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Truck
                    size={16}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {typeof latestBooking.service === "object" &&
                    latestBooking.service
                      ? latestBooking.service.name
                      : latestBooking.service || "General Service"}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <MapPin
                    size={16}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {latestBooking.address ||
                      latestBooking.city ||
                      latestBooking.location?.city ||
                      latestBooking.serviceAddress?.city ||
                      "Location not specified"}
                  </span>
                </div>
              </div>

              {/* Vehicle & Price Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <Package
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Vehicle
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {typeof latestBooking.vehicle === "object" &&
                      latestBooking.vehicle
                        ? `${latestBooking.vehicle.year || ""} ${latestBooking.vehicle.make || ""} ${latestBooking.vehicle.model || ""}`.trim()
                        : latestBooking.vehicle || "Unknown Vehicle"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <User
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Provider
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {latestBooking.providerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <Clock
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Date
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(latestBooking.scheduledDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <CreditCard
                      size={16}
                      className="text-slate-500 dark:text-slate-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Price
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(latestBooking.price?.total || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Image */}
            <div className="lg:w-72 h-44 bg-gradient-to-br from-blue-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center mb-2">
                  <Truck
                    size={40}
                    className="text-primary-600 dark:text-primary-400"
                  />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {latestBooking.service}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Section */}
      {latestBooking && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Recent Booking
            </h2>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const menuId = `card-${latestBooking.id}`;
                  setActiveMenuId(activeMenuId === menuId ? null : menuId);
                }}
                className={`kebab-toggle p-1.5 rounded-lg transition-colors ${
                  activeMenuId === `card-${latestBooking.id}`
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:white"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <MoreVertical size={18} />
              </button>

              {activeMenuId === `card-${latestBooking.id}` && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in duration-200"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewBooking(latestBooking.id);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Eye size={16} className="text-slate-400" />
                    View Details
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/dashboard/support");
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <MessageSquare size={16} className="text-slate-400" />
                    Contact Support
                  </button>

                  {latestBooking.status !== "Completed" &&
                    latestBooking.status !== "completed" &&
                    latestBooking.status !== "Cancelled" &&
                    latestBooking.status !== "cancelled" && (
                      <>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelBooking(latestBooking.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/10 transition-colors"
                        >
                          <XCircle size={16} />
                          Cancel Booking
                        </button>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Route Info Bar */}
          <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <Package
                    size={18}
                    className="text-primary-600 dark:text-primary-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Booking Reference
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    #{latestBooking.reference}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <User
                    size={18}
                    className="text-slate-600 dark:text-slate-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Provider
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {latestBooking.providerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Calendar
                    size={18}
                    className="text-slate-600 dark:text-slate-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Scheduled Date
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {latestBooking.formattedScheduledDateTime ||
                      formatDate(latestBooking.scheduledDate, "datetime")}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badge on new line */}
            <div>
              <StatusBadge status={latestBooking.status} type="booking" />
            </div>
          </div>

          {/* Timeline - Only show if enabled (hidden in updated design) */}
          {SHOW_TIMELINE && latestBooking.timeline && (
            <div className="pt-6 space-y-4">
              {latestBooking.timeline.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    {step.completed ? (
                      <CheckCircle
                        size={20}
                        className="text-success-600 dark:text-success-500"
                      />
                    ) : (
                      <Circle
                        size={20}
                        className="text-slate-300 dark:text-slate-600"
                      />
                    )}
                    {index < latestBooking.timeline.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${step.completed ? "bg-success-600 dark:bg-success-500" : "bg-slate-200 dark:bg-slate-700"}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between pb-2">
                    <div>
                      <p
                        className={`text-sm font-medium ${step.completed ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                      >
                        {step.status}
                      </p>
                      {step.date && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {latestBooking.address}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {step.date ? formatDate(step.date, "datetime") : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            History
          </h2>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Service
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredBookings.slice(0, 5).map((booking, index) => (
                <tr
                  key={booking.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {booking.reference}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {typeof booking.service === "object" && booking.service
                        ? booking.service.name
                        : booking.service || "General Service"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {typeof booking.vehicle === "object" && booking.vehicle
                        ? `${booking.vehicle.year || ""} ${booking.vehicle.make || ""} ${booking.vehicle.model || ""}`.trim()
                        : booking.vehicle || "Unknown Vehicle"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {booking.providerName}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(booking.scheduledDate)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {formatCurrency(booking.price?.total || 0)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={booking.status} type="booking" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(
                            activeMenuId === booking.id ? null : booking.id,
                          );
                        }}
                        className="kebab-toggle p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === booking.id && (
                        <div
                          ref={menuRef}
                          className={`absolute right-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in duration-200 ${
                            // If there's only a few items, open upwards for the last one or two
                            index >= 2 &&
                            index === filteredBookings.slice(0, 5).length - 1
                              ? "bottom-full mb-2"
                              : "top-full mt-1"
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewBooking(booking.id);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <Eye size={16} className="text-slate-400" />
                            View Details
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/dashboard/support");
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <MessageSquare
                              size={16}
                              className="text-slate-400"
                            />
                            Contact Support
                          </button>

                          {booking.status !== "Completed" &&
                            booking.status !== "completed" &&
                            booking.status !== "Cancelled" &&
                            booking.status !== "cancelled" && (
                              <>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelBooking(booking.id);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/10 transition-colors"
                                >
                                  <XCircle size={16} />
                                  Cancel Booking
                                </button>
                              </>
                            )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              No bookings found
            </p>
          </div>
        )}
      </div>

      {/* Request Quote Modal */}
      <RequestQuoteModal
        isOpen={showRequestModal}
        onClose={handleRequestModalClose}
      />

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdate={fetchData}
      />
    </div>
  );
};

export default Overview;
