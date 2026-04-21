import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";
import useDashboardStore, { formatCurrency } from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import bookingService from "../../services/bookingService";
import paymentService from "../../services/paymentService";
import { mapBooking } from "../../utils/dataMappers";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import BookingCard from "../../components/dashboard/BookingCard";
import BookingDetailDrawer from "../../components/dashboard/BookingDetailDrawer";
import { downloadInvoice } from "../../utils/invoiceUtils";
import { CardSkeleton } from "../../components/skeletons/CardSkeleton";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ReviewModal from "../../components/dashboard/ReviewModal";

const INITIAL_LIMIT = 5;
const EXPANDED_LIMIT = 50;

// Status groups for separate API calls
const STATUS_GROUPS = {
  actionRequired: "awaiting-customer-approval,completed-by-fitter",
  upcoming: "confirmed,accepted,in-progress,searching,arrived,service-done,payment-pending",
  completed: "completed",
  cancelled: "cancelled,rejected,expired",
};

const Bookings = () => {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const { addToast, fetchQuotes } = useDashboardStore();

  // Per-category state
  const [categories, setCategories] = useState({
    actionRequired: { items: [], total: 0, expanded: false },
    upcoming: { items: [], total: 0, expanded: false },
    completed: { items: [], total: 0, expanded: false },
    cancelled: { items: [], total: 0, expanded: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const fetchBookingDetails = useDashboardStore(
    (state) => state.fetchBookingDetails,
  );
  const [mismatchEmail, setMismatchEmail] = useState(null);

  // Acknowledge (complete) modal state
  const [acknowledgeBooking, setAcknowledgeBooking] = useState(null);
  const [acknowledgeLoading, setAcknowledgeLoading] = useState(false);

  // Cancel modal state
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelQuote, setCancelQuote] = useState(null);
  const [cancelQuoteLoading, setCancelQuoteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Check for Deep Link User Mismatch
  useEffect(() => {
    const mismatch = sessionStorage.getItem("deep_link_user_mismatch");
    if (mismatch) {
      setMismatchEmail(mismatch);
    }
  }, []);

  const handleLogoutAndSwitch = () => {
    sessionStorage.removeItem("deep_link_user_mismatch");
    const { logout } = useAuthStore.getState();
    logout();
    window.location.reload();
  };

  const dismissMismatch = () => {
    sessionStorage.removeItem("deep_link_user_mismatch");
    setMismatchEmail(null);
  };

  // Fetch a single category
  const fetchCategory = useCallback(async (category, limit = INITIAL_LIMIT) => {
    try {
      const res = await bookingService.getBookings({
        status: STATUS_GROUPS[category],
        limit,
      });
      if (res.success) {
        const mapped = res.data.map(mapBooking);
        return { items: mapped, total: res.pagination?.total || mapped.length };
      }
    } catch (err) {
      console.error(`Failed to load ${category} bookings:`, err);
    }
    return { items: [], total: 0 };
  }, []);

  // Fetch all categories in parallel
  const fetchAllBookings = useCallback(async () => {
    setIsLoading(true);
    const [actionRequired, upcoming, completed, cancelled] = await Promise.all([
      fetchCategory("actionRequired", INITIAL_LIMIT),
      fetchCategory("upcoming", INITIAL_LIMIT),
      fetchCategory("completed", INITIAL_LIMIT),
      fetchCategory("cancelled", INITIAL_LIMIT),
    ]);

    // Move "searching" bookings with quotes from upcoming to actionRequired
    const searchingWithQuotes = upcoming.items.filter(
      (b) => b.status?.toLowerCase() === "searching" && b.quotes?.length > 0,
    );
    const movedItems = [...searchingWithQuotes];
    const movedIds = new Set(movedItems.map((b) => b.id));

    setCategories({
      actionRequired: {
        items: [...actionRequired.items, ...movedItems],
        total: actionRequired.total + movedItems.length,
        expanded: false,
      },
      upcoming: {
        items: upcoming.items.filter((b) => !movedIds.has(b.id)),
        total: Math.max(0, upcoming.total - movedItems.length),
        expanded: false,
      },
      completed: { ...completed, expanded: false },
      cancelled: { ...cancelled, expanded: false },
    });
    setIsLoading(false);
  }, [fetchCategory]);

  // Expand a category to load all items
  const handleViewAll = async (category) => {
    const result = await fetchCategory(category, EXPANDED_LIMIT);
    setCategories((prev) => ({
      ...prev,
      [category]: { ...result, expanded: true },
    }));
  };

  const location = useLocation();
  const isVerifyingRef = useRef(false);

  const verifyPayment = async (reference) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    try {
      setIsVerifying(true);
      const res = await paymentService.verifyPaystack(reference);
      if (res.success) {
        addToast({
          type: "success",
          message: "Payment confirmed! Your booking is now scheduled.",
        });
        fetchAllBookings();
        fetchQuotes().catch(() => {});
      }
    } catch (err) {
      addToast({
        type: "error",
        message: "Failed to verify payment. Please contact support.",
      });
    } finally {
      setIsVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  useEffect(() => {
    fetchAllBookings();

    const queryParams = new URLSearchParams(location.search);
    const reference = queryParams.get("reference");
    const trxref = queryParams.get("trxref");

    if (reference || trxref) {
      verifyPayment(reference || trxref);
      navigate("/dashboard/bookings", { replace: true });
    }
  }, [location.search]);

  // All bookings flat list for deep-link lookup
  const allBookings = [
    ...categories.actionRequired.items,
    ...categories.upcoming.items,
    ...categories.completed.items,
    ...categories.cancelled.items,
  ];

  // Sync selected booking when ID changes
  useEffect(() => {
    const checkAndFetchBooking = async () => {
      if (id) {
        let b = allBookings.find(
          (item) => item.id === id || item.reference === id,
        );

        if (b) {
          setSelectedBooking(b);
        } else {
          const fetchedBooking = await fetchBookingDetails(id);
          if (fetchedBooking) {
            const s = fetchedBooking.status?.toLowerCase();
            const isPrePayment =
              s === "awaiting-payment" || s === "awaiting-provider-acceptance";
            if (isPrePayment) {
              const quoteId =
                fetchedBooking.quote?._id || fetchedBooking.quote;
              if (quoteId) {
                navigate(`/dashboard/quotes/${quoteId}`, { replace: true });
              } else {
                navigate("/dashboard/quotes", { replace: true });
              }
            } else {
              setSelectedBooking(fetchedBooking);
            }
          }
        }
      } else {
        setSelectedBooking(null);
      }
    };

    if (!isLoading) checkAndFetchBooking();
  }, [id, isLoading]);

  // ── Handlers ──
  const handleBookAppointment = (booking) => {
    const quoteId =
      booking.quote?._id ||
      (typeof booking.quote === "string" ? booking.quote : null) ||
      booking.quoteId ||
      booking.quoteRequestId;
    if (quoteId) {
      navigate(`/dashboard/quotes/${quoteId}/book-appointment`);
    } else {
      addToast({ type: "info", message: "Unable to find linked quote." });
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    navigate(`/dashboard/bookings/${booking.id}`, { replace: true });
  };

  const handleCloseDrawer = () => {
    setSelectedBooking(null);
    navigate("/dashboard/bookings", { replace: true });
  };

  const handleAcknowledge = async () => {
    if (!acknowledgeBooking) return;
    setAcknowledgeLoading(true);
    try {
      const res = await bookingService.completeBooking(acknowledgeBooking.id);
      if (res.success) {
        addToast({ type: "success", message: "Booking marked as completed. Thank you!" });
        setAcknowledgeBooking(null);
        fetchAllBookings();
      }
    } catch (err) {
      addToast({ type: "error", message: "Failed to complete booking. Please try again." });
    } finally {
      setAcknowledgeLoading(false);
    }
  };

  const handleOpenCancelModal = async (b) => {
    setCancelBooking(b);
    setCancelQuoteLoading(true);
    setCancelQuote(null);
    try {
      const resp = await bookingService.getCancellationQuote(b.id);
      if (resp.success) setCancelQuote(resp.data);
    } catch (err) {
      console.error("Failed to fetch cancellation quote:", err);
    } finally {
      setCancelQuoteLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;
    setCancelLoading(true);
    try {
      await bookingService.cancelBooking(cancelBooking.id, "Customer requested cancellation");
      addToast({ type: "success", message: "Booking cancelled successfully" });
      setCancelBooking(null);
      setCancelQuote(null);
      fetchAllBookings();
    } catch (err) {
      addToast({ type: "error", message: "Failed to cancel booking" });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    setReviewLoading(true);
    try {
      const res = await bookingService.addReview(reviewBooking.id, reviewData);
      if (res.success) {
        addToast({ type: "success", message: "Review submitted successfully" });
        setReviewBooking(null);
        fetchAllBookings();
      }
    } catch (error) {
      addToast({
        type: "error",
        message: error.message || "Failed to submit review",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Card callbacks (shared) ──
  const cardProps = (booking) => ({
    booking,
    onClick: () => handleViewBooking(booking),
    onBookAppointment: handleBookAppointment,
    onCancel: (b) => handleOpenCancelModal(b),
    onReschedule: (b) => {
      navigate(`/dashboard/bookings/${b.id}/reschedule`);
    },
    onInvoice: (b) =>
      downloadInvoice(b.id, b.reference, (msg, type) =>
        addToast({ type: type || "error", message: msg }),
      ),
    onRate: (b) => {
      setReviewBooking(b);
    },
    onDirections: (b) => {
      const ws = b.workshopAddress;
      const addr = ws
        ? [ws.addressLine1, ws.suburb, ws.city, ws.province, ws.postalCode].filter(Boolean).join(", ")
        : b.address || "";
      if (!addr) return;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`, "_blank");
    },
    onAcknowledge: (b) => setAcknowledgeBooking(b),
  });

  // ── Render states ──
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-[1.625rem] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.025em]">
            My Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upcoming and past appointments
          </p>
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  const hasBookings = allBookings.length > 0;

  // Section config
  const sections = [
    {
      key: "actionRequired",
      title: "Action Required",
      badge: true,
      opacity: false,
      category: "actionRequired",
    },
    {
      key: "upcoming",
      title: "Upcoming",
      badge: false,
      opacity: false,
      category: "upcoming",
    },
    {
      key: "completed",
      title: "Completed",
      badge: false,
      opacity: false,
      category: "completed",
    },
    {
      key: "cancelled",
      title: "Cancelled",
      badge: false,
      opacity: true,
      category: "cancelled",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-[1.625rem] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.025em]">
          My Bookings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upcoming and past appointments
        </p>
      </div>

      {/* Mismatch Warning */}
      {mismatchEmail && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertCircle
            className="text-amber-600 dark:text-amber-400 mt-0.5"
            size={20}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Account Mismatch Detected
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You clicked a link for <strong>{mismatchEmail}</strong>, but you
              are currently logged in as{" "}
              <strong>{useAuthStore.getState().user?.email}</strong>. The
              booking you are looking for may not be visible.
            </p>
            <div className="flex gap-3 mt-3">
              <Button
                onClick={handleLogoutAndSwitch}
                size="sm"
                variant="secondary"
                className="bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100"
              >
                Log Out & Switch
              </Button>
              <Button
                onClick={dismissMismatch}
                size="sm"
                variant="ghost"
                className="text-amber-700 dark:text-amber-400"
              >
                Stay as {useAuthStore.getState().user?.name}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hasBookings && (
        <EmptyState
          iconType="bookings"
          title="No bookings yet"
          description="Request a quote from a provider to create your first booking."
          actionLabel="Request a Quote"
          onAction={() => navigate("/dashboard/quotes")}
        />
      )}

      {/* ── Booking Sections ── */}
      {sections.map(({ key, title, badge, opacity, category }) => {
        const cat = categories[key];
        if (cat.items.length === 0) return null;

        const displayed = cat.expanded ? cat.items : cat.items.slice(0, INITIAL_LIMIT);
        const hasMore = !cat.expanded && cat.total > INITIAL_LIMIT;

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[1.0625rem] font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {badge && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">
                  {cat.total}
                </span>
              )}
            </div>
            <div className={`space-y-4${opacity ? " opacity-70" : ""}`}>
              {displayed.map((b) => (
                <BookingCard key={b.id} {...cardProps(b)} category={key === "upcoming" ? "upcoming" : undefined} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => handleViewAll(category)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
              >
                View All ({cat.total})
                <ChevronDown size={16} />
              </button>
            )}
          </div>
        );
      })}

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={handleCloseDrawer}
        onUpdate={fetchAllBookings}
        initialAction={action}
      />

      {/* Acknowledge / Complete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!acknowledgeBooking}
        onClose={() => setAcknowledgeBooking(null)}
        onConfirm={handleAcknowledge}
        loading={acknowledgeLoading}
        title="Confirm Service Completion"
        message="The fitter has marked your service as completed. Please confirm that the work has been done to your satisfaction. This will finalize your booking."
        confirmLabel="Yes, Complete Booking"
        cancelLabel="Not Yet"
        type="info"
      />

      {/* Cancel Booking Modal */}
      <ConfirmModal
        isOpen={!!cancelBooking}
        onClose={() => {
          setCancelBooking(null);
          setCancelQuote(null);
        }}
        onConfirm={handleCancelBooking}
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
                    <span className="text-slate-600 dark:text-slate-400">Booking Total:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(cancelQuote.bookingTotal)}
                    </span>
                  </div>
                  {cancelQuote.cancellationFee > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>
                        Cancellation Fee{cancelQuote.wasWithinGracePeriod ? "" : " (Outside Grace Period)"}:
                      </span>
                      <span>- {formatCurrency(cancelQuote.cancellationFee)}</span>
                    </div>
                  )}
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold">
                    <span className={cancelQuote.refundAmount > 0 ? "text-green-600 dark:text-green-400" : "text-slate-900 dark:text-slate-100"}>
                      Refund Amount:
                    </span>
                    <span className={cancelQuote.refundAmount > 0 ? "text-green-600 dark:text-green-400" : "text-slate-900 dark:text-slate-100"}>
                      {formatCurrency(cancelQuote.refundAmount)}
                    </span>
                  </div>
                  {cancelQuote.refundAmount > 0 ? (
                    <p className="text-xs text-slate-500 mt-2 pt-2 text-center italic">
                      Refunds are processed to your original payment method within 3-5 business days.
                    </p>
                  ) : cancelQuote.cancellationFee > 0 ? (
                    <p className="text-xs text-red-500 mt-2 pt-2 text-center italic">
                      No refund available. The cancellation fee equals the full booking amount.
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
        loading={cancelLoading || cancelQuoteLoading}
      />

      {/* Review Modal (standalone — not inside drawer) */}
      <ReviewModal
        isOpen={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSubmit={handleReviewSubmit}
        booking={reviewBooking}
        isLoading={reviewLoading}
      />
    </div>
  );
};

export default Bookings;
