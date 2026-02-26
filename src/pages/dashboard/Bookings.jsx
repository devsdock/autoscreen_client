import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Search,
  Calendar,
  Filter,
  Loader2,
  Star,
  RotateCcw,
} from "lucide-react";
import useDashboardStore, {
  formatDate,
  formatCurrency,
} from "../../store/useDashboardStore";
import bookingService from "../../services/bookingService";
import paymentService from "../../services/paymentService";
import { mapBooking } from "../../utils/dataMappers";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import BookingDetailDrawer from "../../components/dashboard/BookingDetailDrawer";
import { downloadInvoice } from "../../utils/invoiceUtils";
import Tooltip from "../../components/ui/Tooltip";
import { CardSkeleton } from "../../components/skeletons/CardSkeleton";

const Bookings = () => {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const { addToast } = useDashboardStore();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tabsInitialized, setTabsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const fetchBookingDetails = useDashboardStore(
    (state) => state.fetchBookingDetails,
  );
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await bookingService.getBookings();
      if (res.success) {
        // Use data mappers to format backend data for components
        const mappedBookings = res.data.map(mapBooking);
        setBookings(mappedBookings);

        // If there's an ID in URL, select that booking
        if (id) {
          const booking = mappedBookings.find(
            (b) => b.id === id || b.reference === id,
          );
          if (booking) setSelectedBooking(booking);
        }

        // Default to Action Required if any exist, otherwise All
        const hasActionRequired = mappedBookings.some((b) => {
          const s = b.status?.toLowerCase();
          return (
            s === "awaiting-customer-approval" ||
            (s === "searching" && b.quotes?.length > 0)
          );
        });
        if (!tabsInitialized && !id) {
          if (hasActionRequired) {
            setActiveTab("action-required");
          } else if (activeTab === "all" || activeTab === "action-required") {
            setActiveTab("upcoming");
          }
          setTabsInitialized(true);
        }
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const location = useLocation();

  const verifyPayment = async (reference) => {
    try {
      setIsVerifying(true);
      const res = await paymentService.verifyPaystack(reference);
      if (res.success) {
        addToast({
          type: "success",
          message: "Payment confirmed! Your booking is now scheduled.",
        });
        fetchBookings();
      }
    } catch (err) {
      addToast({
        type: "error",
        message: "Failed to verify payment. Please contact support.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const queryParams = new URLSearchParams(location.search);
    const reference = queryParams.get("reference");
    const trxref = queryParams.get("trxref");

    if (reference || trxref) {
      verifyPayment(reference || trxref);
      // Clean up URL
      navigate("/dashboard/bookings", { replace: true });
    }
  }, [location.search]);

  // Sync selected booking when ID changes or bookings list updates
  useEffect(() => {
    const checkAndFetchBooking = async () => {
      if (id) {
        let b = bookings.find(
          (item) => item.id === id || item.reference === id,
        );

        if (b) {
          setSelectedBooking(b);
        } else {
          // If not found in current list, fetch specifically
          setIsLoading(true);
          const fetchedBooking = await fetchBookingDetails(id);
          if (fetchedBooking) {
            setSelectedBooking(fetchedBooking);
            // Also add to local bookings if not already there to show in list if needed
            setBookings((prev) => {
              if (prev.find((p) => p.id === fetchedBooking.id)) return prev;
              return [fetchedBooking, ...prev];
            });
          }
          setIsLoading(false);
        }
      } else {
        setSelectedBooking(null);
      }
    };

    checkAndFetchBooking();
  }, [id, bookings, fetchBookingDetails]);

  // Filter logic
  const now = new Date();
  const actionRequiredCount = bookings.filter((b) => {
    const s = b.status?.toLowerCase();
    return (
      s === "awaiting-customer-approval" ||
      (s === "searching" && b.quotes?.length > 0)
    );
  }).length;

  const tabs = [
    ...(actionRequiredCount > 0
      ? [
          {
            value: "action-required",
            label: "Action Required",
            count: actionRequiredCount,
          },
        ]
      : []),
    {
      value: "upcoming",
      label: "Upcoming",
      count: bookings.filter((b) => {
        const s = b.status?.toLowerCase();
        const isActionRequired =
          s === "awaiting-customer-approval" ||
          (s === "searching" && b.quotes?.length > 0);
        return (
          [
            "confirmed",
            "accepted",
            "pending payment",
            "awaiting-payment",
            "searching",
          ].includes(s) &&
          !isActionRequired &&
          new Date(b.scheduledDate) > now
        );
      }).length,
    },
    {
      value: "completed",
      label: "Completed",
      count: bookings.filter((b) => {
        const s = b.status?.toLowerCase();
        return s === "completed" || s === "completed-by-fitter";
      }).length,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      count: bookings.filter((b) =>
        ["cancelled", "rejected", "expired"].includes(b.status?.toLowerCase()),
      ).length,
    },
    { value: "all", label: "All", count: bookings.length },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const status = booking.status?.toLowerCase();
    // Tab filter
    if (activeTab === "action-required") {
      const isActionRequired =
        status === "awaiting-customer-approval" ||
        (status === "searching" && booking.quotes?.length > 0);
      if (!isActionRequired) return false;
    }

    if (activeTab === "upcoming") {
      const isActionRequired =
        status === "awaiting-customer-approval" ||
        (status === "searching" && booking.quotes?.length > 0);
      if (
        !(
          [
            "confirmed",
            "accepted",
            "pending payment",
            "awaiting-payment",
            "searching",
          ].includes(status) &&
          !isActionRequired &&
          new Date(booking.scheduledDate) > now
        )
      )
        return false;
    }
    if (
      activeTab === "completed" &&
      status !== "completed" &&
      status !== "completed-by-fitter"
    )
      return false;
    if (
      activeTab === "cancelled" &&
      !["cancelled", "rejected", "expired"].includes(status)
    )
      return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.reference?.toLowerCase().includes(query) ||
        booking.vehicle?.toLowerCase().includes(query) ||
        booking.providerName?.toLowerCase().includes(query) ||
        booking.service?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    navigate(`/dashboard/bookings/${booking.id}`, { replace: true });
  };

  const handleCloseDrawer = () => {
    setSelectedBooking(null);
    navigate("/dashboard/bookings", { replace: true });
  };

  const getEmptyState = () => {
    if (searchQuery) {
      return {
        title: "No matching bookings",
        description: "Try a different search term.",
        actionLabel: "Clear Search",
        onAction: () => setSearchQuery(""),
      };
    }

    if (activeTab === "action-required") {
      return {
        title: "No actions required",
        description:
          "You're all caught up! No quotes to review or completed services to confirm.",
        actionLabel: "Book New Service",
        onAction: () => navigate("/dashboard/book"),
      };
    }

    if (bookings.length === 0) {
      return {
        title: "No bookings yet",
        description:
          "Request a quote or search for a provider to create your first booking.",
        actionLabel: "Book Now",
        onAction: () => navigate("/dashboard/book"),
      };
    }

    if (activeTab === "upcoming") {
      return {
        title: "No upcoming bookings",
        description: "You don't have any scheduled appointments coming up.",
        actionLabel: "Book New Service",
        onAction: () => navigate("/dashboard/book"),
      };
    }

    if (activeTab === "completed") {
      return {
        title: "No completed bookings",
        description: "Past served bookings will appear here.",
        actionLabel: null,
        onAction: null,
      };
    }

    if (activeTab === "cancelled") {
      return {
        title: "No cancelled bookings",
        description: "You don't have any cancelled appointments.",
        actionLabel: null,
        onAction: null,
      };
    }

    return {
      title: "No bookings found",
      description: "No bookings in this category.",
      actionLabel: "Book New Service",
      onAction: () => navigate("/dashboard/book"),
    };
  };

  const emptyState = getEmptyState();

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Verifying Payment...
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Please wait while we confirm your appointment.
        </p>
      </div>
    );
  }

  if (isLoading && bookings.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Bookings"
          subtitle="Track your auto glass appointments"
        />
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
            className="overflow-x-auto"
          />
          <Input
            placeholder="Search bookings..."
            icon={Search}
            className="w-full sm:w-64"
            disabled
          />
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bookings"
        subtitle="Track your auto glass appointments"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
          className="overflow-x-auto"
        />
        <Input
          placeholder="Search bookings..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          iconType="bookings"
          title={emptyState.title}
          description={emptyState.description}
          actionLabel={emptyState.actionLabel}
          onAction={emptyState.onAction}
        />
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card
              key={booking.id}
              className="hover:shadow-card-hover transition-shadow cursor-pointer"
              onClick={() => handleViewBooking(booking)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between lg:justify-start gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                        #{booking.reference}
                      </span>
                      <StatusBadge
                        status={
                          booking.status?.toLowerCase() === "searching" &&
                          booking.quotes?.length > 0
                            ? "awaiting-customer-approval"
                            : booking.status
                        }
                        type="booking"
                      />

                      <StatusBadge
                        status={booking.paymentStatus}
                        type="payment"
                      />
                    </div>
                    {["refunded", "partial refund"].includes(
                      booking.paymentStatus?.toLowerCase(),
                    ) &&
                      booking.refundAmount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded-full w-fit">
                          <RotateCcw size={12} />
                          <span>
                            Refunded: {formatCurrency(booking.refundAmount)}
                          </span>
                        </div>
                      )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {booking.service}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {booking.vehicle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {booking.providerName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">
                      •
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar
                        size={14}
                        className="text-slate-400 dark:text-slate-500"
                      />
                      {formatDate(booking.scheduledDate, "datetime")}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">
                      •
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(booking.price?.total || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  {booking.paymentStatus &&
                    [
                      "paid",
                      "partially refunded",
                      "partially_refunded",
                    ].includes(booking.paymentStatus.toLowerCase()) && (
                      <Tooltip
                        content={
                          !["completed", "completed-by-fitter"].includes(
                            booking.status?.toLowerCase(),
                          )
                            ? "Invoice available once booking is completed"
                            : ""
                        }
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={
                            !["completed", "completed-by-fitter"].includes(
                              booking.status?.toLowerCase(),
                            )
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadInvoice(
                              booking.id,
                              booking.reference,
                              (msg, type) =>
                                addToast({
                                  type: type || "error",
                                  message: msg,
                                }),
                            );
                          }}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Invoice
                        </Button>
                      </Tooltip>
                    )}
                  <Button
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewBooking(booking);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={handleCloseDrawer}
        onUpdate={fetchBookings}
        initialAction={action}
      />
    </div>
  );
};

export default Bookings;
