import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  LogOut,
  Menu,
  Sun,
  Moon,
  Monitor,
  X,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";
import Avatar from "../ui/Avatar";
import { NodeURL } from "../../services/api";

const ThemeToggle = () => {
  const { theme, setTheme } = useDashboardStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title={`Theme: ${currentTheme.label}`}
      >
        <CurrentIcon size={20} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTheme(id);
                setDropdownOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                ${
                  theme === id
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }
              `}
            >
              <Icon size={16} />
              <span>{label}</span>
              {theme === id && (
                <span className="ml-auto w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardTopBar = () => {
  const { toggleSidebar, addToast } = useDashboardStore();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const deleteNotification = useNotificationStore(
    (state) => state.deleteNotification,
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    addToast({ type: "info", message: "Logging out..." });
    setDropdownOpen(false);
    await logout();
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 transition-colors">
      {/* Left side - Mobile menu + Search */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right side - Theme + Notifications + Help + Profile */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={`
              p-2.5 rounded-lg transition-colors relative
              ${
                notifOpen
                  ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }
            `}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-[0.3rem] right-[0.4rem] w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Notifications
                </p>
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[11px] text-red-500 hover:text-red-600 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif._id}
                      onClick={() => {
                        if (!notif.isRead) markAsRead(notif._id);

                        const type = notif.type || "";
                        const bookingId =
                          notif.data?.bookingId || notif.data?.quoteId || "";

                        if (
                          type.includes("quote") ||
                          type.includes("booking")
                        ) {
                          // REDIRECT TO BOOKING DETAILS DRAWER FOR QUOTES TOO
                          // Fetch latest booking details to ensure status is up to date
                          useDashboardStore
                            .getState()
                            .fetchBookingDetails(bookingId);
                          navigate(`/dashboard/bookings/${bookingId}`);
                        } else {
                          navigate("/dashboard/overview");
                        }

                        setNotifOpen(false);
                      }}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 relative group
                        ${!notif.isRead ? "bg-primary-50/30 dark:bg-primary-900/10" : ""}
                      `}
                    >
                      {/* Delete notification button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif._id);
                        }}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Delete notification"
                      >
                        <X size={14} />
                      </button>

                      <div className="flex justify-between items-start mb-1 pr-6">
                        <p
                          className={`text-sm font-medium ${notif.isRead ? "text-slate-700 dark:text-slate-300" : "text-primary-600 dark:text-primary-400"}`}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                        {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <HelpCircle size={20} />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Avatar
              src={
                user?.avatar ||
                (user?.profileImage
                  ? user.profileImage.startsWith("http")
                    ? user.profileImage
                    : `${NodeURL}${user.profileImage}`
                  : null)
              }
              name={
                user?.name ||
                `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                "User"
              }
              size="sm"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {user?.name ||
                  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                  "User"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>
            <ChevronDown
              size={16}
              className="text-slate-400 dark:text-slate-500 hidden md:block"
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 md:hidden">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {user?.name ||
                    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                    "User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                <Link
                  to="/dashboard/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <User size={16} />
                  <span>My Profile</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardTopBar;
