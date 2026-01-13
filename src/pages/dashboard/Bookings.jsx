import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Calendar, Filter, Loader2 } from "lucide-react";
import useDashboardStore, {
  formatDate,
  formatCurrency,
} from "../../store/useDashboardStore";
import bookingService from "../../services/bookingService";
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

const Bookings = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useDashboardStore();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
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
            (b) => b.id === id || b.reference === id
          );
          if (booking) setSelectedBooking(booking);
        }
      }
    } catch (err) {
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Sync selected booking when ID changes or bookings list updates
  useEffect(() => {
    if (id && bookings.length > 0) {
      const b = bookings.find(
        (item) => item.id === id || item.reference === id
      );
      if (b) setSelectedBooking(b);
    } else if (!id) {
      setSelectedBooking(null);
    }
  }, [id, bookings]);

  // Filter logic
  const now = new Date();
  const tabs = [
    { value: "all", label: "All", count: bookings.length },
    {
      value: "upcoming",
      label: "Upcoming",
      count: bookings.filter((b) => {
        const s = b.status?.toLowerCase();
        return (
          [
            "confirmed",
            "accepted",
            "pending payment",
            "awaiting-payment",
          ].includes(s) && new Date(b.scheduledDate) > now
        );
      }).length,
    },
    {
      value: "completed",
      label: "Completed",
      count: bookings.filter((b) => b.status?.toLowerCase() === "completed")
        .length,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      count: bookings.filter((b) =>
        ["cancelled", "rejected", "expired"].includes(b.status?.toLowerCase())
      ).length,
    },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const status = booking.status?.toLowerCase();
    // Tab filter
    if (
      activeTab === "upcoming" &&
      !(
        [
          "confirmed",
          "accepted",
          "pending payment",
          "awaiting-payment",
        ].includes(status) && new Date(booking.scheduledDate) > now
      )
    )
      return false;
    if (activeTab === "completed" && status !== "completed") return false;
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

  if (isLoading && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-600 mb-4" size={48} />
        <p className="text-slate-500">Loading your bookings...</p>
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
                      <StatusBadge status={booking.status} type="booking" />
                      <StatusBadge
                        status={booking.paymentStatus}
                        type="payment"
                      />
                    </div>
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
                  {(["Confirmed", "Completed"].includes(booking.status) ||
                    (booking.paymentStatus &&
                      ["Paid", "Partially Refunded"].includes(
                        booking.paymentStatus
                      ))) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadInvoice(booking.id, (msg) =>
                          addToast({ type: "error", message: msg })
                        );
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Invoice
                    </Button>
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
      />
    </div>
  );
};

export default Bookings;
