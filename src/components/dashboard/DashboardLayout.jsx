import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { CheckCircle } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";
import DashboardRightSidebar from "./DashboardRightSidebar";
import ToastContainer from "../ui/Toast";
import useDashboardStore, {
  formatCurrency,
} from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";
import socketService from "../../services/socketService";
import bookingService from "../../services/bookingService";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import SupportChatPopup from "../chat/SupportChatPopup";

// Toggle this to show/hide the right sidebar
// Set to true to enable the right sidebar in the future
const SHOW_RIGHT_SIDEBAR = false;

const DashboardLayout = () => {
  const { sidebarCollapsed, setSidebarOpen, initTheme, bookings, addToast } =
    useDashboardStore();
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [targetCompletedBookingId, setTargetCompletedBookingId] =
    useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    initTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const theme = useDashboardStore.getState().theme;
      if (theme === "system") {
        if (mediaQuery.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [initTheme]);

  // Auto-close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // Socket & Notifications Init
  const { user } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();
  const { fetchBookings, fetchQuotes, fetchProfileData } = useDashboardStore();

  useEffect(() => {
    if (user?._id) {
      socketService.connect(user._id);
      fetchNotifications();
      fetchBookings();
      fetchQuotes();
      fetchProfileData();
    }

    return () => {
      socketService.disconnect();
    };
  }, [user?._id, fetchNotifications]);

  // Completion Modal Logic (Global)
  useEffect(() => {
    const completedFitterBookings = bookings.filter((b) => {
      const s = b.status?.toLowerCase();
      return s === "completed-by-fitter";
    });

    let dismissedBookings = [];
    try {
      dismissedBookings = JSON.parse(
        sessionStorage.getItem("dismissed_completed_bookings") || "[]",
      );
    } catch (e) {}

    const hasUnacknowledged = completedFitterBookings.filter(
      (b) => !dismissedBookings.includes(b.id),
    );

    if (hasUnacknowledged.length > 0) {
      setTargetCompletedBookingId(hasUnacknowledged[0].id);
      setShowCompletedModal(true);
    } else {
      setShowCompletedModal(false);
    }
  }, [bookings, showCompletedModal]);

  const handleDismissModal = () => {
    if (!targetCompletedBookingId) {
      setShowCompletedModal(false);
      return;
    }

    setShowCompletedModal(false);

    let dismissedBookings = [];
    try {
      dismissedBookings = JSON.parse(
        sessionStorage.getItem("dismissed_completed_bookings") || "[]",
      );
    } catch (e) {}

    sessionStorage.setItem(
      "dismissed_completed_bookings",
      JSON.stringify([
        ...new Set([...dismissedBookings, targetCompletedBookingId]),
      ]),
    );
  };

  const handleGlobalCompleteBooking = async () => {
    if (!targetCompletedBookingId) return;
    setIsCompleting(true);
    try {
      const res = await bookingService.completeBooking(
        targetCompletedBookingId,
      );
      if (res.success) {
        if (addToast)
          addToast({ type: "success", message: "Booking marked as completed" });

        // Add to dismissed list so it doesn't reappear while fetching
        let dismissedBookings = [];
        try {
          dismissedBookings = JSON.parse(
            sessionStorage.getItem("dismissed_completed_bookings") || "[]",
          );
        } catch (e) {}

        sessionStorage.setItem(
          "dismissed_completed_bookings",
          JSON.stringify([
            ...new Set([...dismissedBookings, targetCompletedBookingId]),
          ]),
        );

        setShowCompletedModal(false);
        fetchBookings();
      }
    } catch (error) {
      console.error("Error completing booking:", error);
      if (addToast)
        addToast({ type: "error", message: "Failed to complete booking" });
    } finally {
      setIsCompleting(false);
    }
  };

  const targetCompletedBooking = bookings.find(
    (b) => b.id === targetCompletedBookingId,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Sidebar */}
      <DashboardSidebar />

      {/* Main area */}
      <div
        className={`
          min-h-screen flex flex-col
          transition-all duration-300
          ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"}
          ${SHOW_RIGHT_SIDEBAR ? "xl:mr-[320px]" : ""}
        `}
      >
        {/* Top Bar */}
        <DashboardTopBar />

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Right Sidebar - conditionally rendered */}
      {SHOW_RIGHT_SIDEBAR && <DashboardRightSidebar />}

      <SupportChatPopup />
      <ToastContainer />

      {/* Global Service Completed Modal */}
      <Modal
        isOpen={showCompletedModal}
        onClose={handleDismissModal}
        title=""
        size="sm"
      >
        <div className="text-center pb-2">
          <Player
            src="https://assets10.lottiefiles.com/packages/lf20_lk80fpsm.json"
            className="player mx-auto"
            loop
            autoplay
            style={{ height: "160px", width: "160px" }}
          />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            Service Completed!
          </h3>
          {targetCompletedBooking && (
            <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Booking #{targetCompletedBooking.reference}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {typeof targetCompletedBooking.service === "object" &&
                targetCompletedBooking.service
                  ? targetCompletedBooking.service.name
                  : targetCompletedBooking.service || "General Service"}{" "}
                •{" "}
                {typeof targetCompletedBooking.vehicle === "object" &&
                targetCompletedBooking.vehicle
                  ? `${targetCompletedBooking.vehicle.year || ""} ${targetCompletedBooking.vehicle.make || ""} ${targetCompletedBooking.vehicle.model || ""}`.trim()
                  : targetCompletedBooking.vehicle || "Unknown Vehicle"}
              </p>
            </div>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 mb-6">
            The fitter has marked your service as completed. Please review and
            acknowledge the work to finalize your booking.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              disabled={isCompleting}
              onClick={handleDismissModal}
            >
              Not yet
            </Button>
            <Button
              variant="primary"
              disabled={isCompleting}
              onClick={handleGlobalCompleteBooking}
            >
              <CheckCircle size={16} />
              {isCompleting ? "Completing..." : "Completed"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardLayout;
