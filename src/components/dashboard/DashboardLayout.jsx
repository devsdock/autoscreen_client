import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";
import DashboardRightSidebar from "./DashboardRightSidebar";
import ToastContainer from "../ui/Toast";
import useDashboardStore from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";
import socketService from "../../services/socketService";
import SupportChatPopup from "../chat/SupportChatPopup";

// Toggle this to show/hide the right sidebar
// Set to true to enable the right sidebar in the future
const SHOW_RIGHT_SIDEBAR = false;

const DashboardLayout = () => {
  const { sidebarCollapsed, setSidebarOpen, initTheme } = useDashboardStore();

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
  const { fetchBookings, fetchQuotes } = useDashboardStore();

  useEffect(() => {
    if (user?._id) {
      socketService.connect(user._id);
      fetchNotifications();
      fetchBookings();
      fetchQuotes();
    }

    return () => {
      socketService.disconnect();
    };
  }, [user?._id, fetchNotifications]);

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
    </div>
  );
};

export default DashboardLayout;
