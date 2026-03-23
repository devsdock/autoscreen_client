import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  Sun,
  Moon,
  Monitor,
  X,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";
import Avatar from "../ui/Avatar";
import Breadcrumb from "../layout/Breadcrumb";
import { NodeURL } from "../../services/api";

// ═══ INLINE SVG ICONS (crisp, pixel-perfect) ═══

const BellIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width="18"
    height="18"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const MenuIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width="18"
    height="18"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

// ═══ SIMPLE CSS TOOLTIP ═══

const HeaderTooltip = ({ children, label }) => (
  <div className="relative group/tip">
    {children}
    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1.5 text-[11px] font-medium leading-tight text-white bg-slate-900/95 dark:bg-slate-700/95 rounded-lg shadow-xl backdrop-blur-sm whitespace-nowrap pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-[100]">
      {label}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-5px] border-4 border-transparent border-b-slate-900/95 dark:border-b-slate-700/95" />
    </span>
  </div>
);

// ═══ RELATIVE TIME ═══

const getRelativeTimeShort = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
};

// ═══ THEME TOGGLE ═══

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
      <HeaderTooltip label={`Theme: ${currentTheme.label}`}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`
            w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-200
            ${
              dropdownOpen
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-200/50 dark:ring-primary-700/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 hover:shadow-sm active:scale-95"
            }
          `}
        >
          <CurrentIcon size={17} />
        </button>
      </HeaderTooltip>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2.5 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 animate-fade-in z-50 overflow-hidden">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTheme(id);
                setDropdownOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${
                  theme === id
                    ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }
              `}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              {theme === id && (
                <span className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══ MAIN HEADER ═══

const DashboardTopBar = () => {
  const { toggleSidebar, addToast } = useDashboardStore();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
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

  const displayName =
    user?.name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "Customer";

  const firstName = displayName.split(" ")[0];

  const initials = (() => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  })();

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

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);

    const type = notif.type || "";
    const quoteId = notif.data?.quoteId || "";
    const bookingId = notif.data?.bookingId || "";

    if (
      quoteId &&
      (type === "quote_accepted" ||
        type === "slot_proposed" ||
        type === "quote_response" ||
        type === "new_quote_response")
    ) {
      navigate(`/dashboard/quotes/${quoteId}`);
    } else if (
      type.includes("quote") &&
      !type.includes("booking") &&
      quoteId
    ) {
      navigate(`/dashboard/quotes/${quoteId}`);
    } else if (type.includes("booking") || bookingId) {
      useDashboardStore.getState().fetchBookingDetails(bookingId);
      navigate(`/dashboard/bookings/${bookingId}`);
    } else {
      navigate("/dashboard/overview");
    }

    setNotifOpen(false);
  };

  const avatarSrc =
    user?.avatar ||
    (user?.profileImage
      ? user.profileImage.startsWith("http")
        ? user.profileImage
        : `${NodeURL}${user.profileImage}`
      : null);

  return (
    <header className="sticky top-0 z-30 glass-bg border-b border-slate-200/80 dark:border-slate-800">
      <div className="h-[var(--topbar-h)] px-5 lg:px-8">
        <div className="w-full h-full flex items-center">
          {/* Left - Mobile toggle */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden w-[36px] h-[36px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all duration-150 flex-shrink-0"
          >
            <MenuIcon />
          </button>

          {/* Left - Breadcrumb */}
          <div className="flex-1 hidden lg:flex items-center min-h-[36px]">
            <Breadcrumb />
          </div>
          <div className="flex-1 lg:hidden" />

          {/* Right - Actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <HeaderTooltip label="Notifications">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                  className={`
                    relative w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-200
                    ${
                      notifOpen
                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-200/50 dark:ring-primary-700/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 hover:shadow-sm active:scale-95"
                    }
                  `}
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span
                      className="absolute flex items-center justify-center rounded-full bg-red-500 text-white font-bold border-[2px] border-white dark:border-slate-900"
                      style={{
                        top: "0px",
                        right: "-3px",
                        minWidth: "18px",
                        height: "18px",
                        fontSize: "0.5625rem",
                        padding: "0 4px",
                        lineHeight: 1,
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </HeaderTooltip>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div
                  className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[calc(var(--topbar-h)+4px)] sm:top-auto sm:mt-2.5 w-auto sm:w-[420px] bg-white dark:bg-slate-900 rounded-[18px] z-50 animate-fade-in overflow-hidden"
                  style={{
                    boxShadow:
                      "0 12px 48px -4px rgba(0,0,0,0.15), 0 4px 16px -2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Header */}
                  <div className="px-6 pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display font-bold text-[1.125rem] text-slate-900 dark:text-white">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[0.6875rem] font-bold">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="px-2.5 py-1 rounded-lg text-[0.75rem] font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={() => clearAll()}
                            className="px-2.5 py-1 rounded-lg text-[0.75rem] font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 border-t border-slate-100 dark:border-slate-800" />

                  {/* Notification List */}
                  <div className="max-h-[336px] overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <BellIcon className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="font-display font-semibold text-[0.9375rem] text-slate-400 dark:text-slate-500 mb-1">
                          All caught up
                        </p>
                        <p className="text-[0.8125rem] text-slate-400 dark:text-slate-600">
                          No notifications to show right now.
                        </p>
                      </div>
                    ) : (
                      <div className="py-1.5">
                        {notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`relative flex items-start gap-3 px-5 py-3 cursor-pointer transition-all duration-150 group hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            {/* Bell icon */}
                            <div
                              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                notif.isRead
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                                  : "bg-primary-500 text-white shadow-sm"
                              }`}
                            >
                              <BellIcon />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-start justify-between gap-2 mb-0.5">
                                <p
                                  className={`text-[0.8125rem] leading-snug ${
                                    notif.isRead
                                      ? "font-medium text-slate-600 dark:text-slate-400"
                                      : "font-semibold text-slate-900 dark:text-white"
                                  }`}
                                >
                                  {notif.title}
                                </p>
                                <span className="text-[0.6875rem] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0 mt-0.5 tabular-nums">
                                  {getRelativeTimeShort(notif.createdAt)}
                                </span>
                              </div>
                              {notif.message && (
                                <p
                                  className={`text-[0.8125rem] line-clamp-2 leading-relaxed ${
                                    notif.isRead
                                      ? "text-slate-400 dark:text-slate-500"
                                      : "text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {notif.message}
                                </p>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif._id);
                              }}
                              className="absolute top-2.5 right-3 w-7 h-7 flex items-center justify-center rounded-full text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pb-3" />
                </div>
              )}
            </div>

            {/* Account Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 py-[4px] pl-[4px] pr-3 rounded-full transition-all duration-200 ${
                  dropdownOpen
                    ? "bg-slate-200 dark:bg-slate-700 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-sm active:scale-[0.98]"
                }`}
              >
                <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-display font-bold text-[0.6875rem] overflow-hidden">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <span className="hidden sm:block font-medium text-[0.8125rem] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {firstName}
                </span>
              </button>

              {/* Account Dropdown */}
              {dropdownOpen && (
                <div
                  className="fixed sm:absolute right-3 sm:right-0 left-auto top-[calc(var(--topbar-h)+4px)] sm:top-auto sm:mt-2.5 min-w-[240px] bg-white dark:bg-slate-900 rounded-[16px] py-1.5 animate-fade-in z-50 overflow-hidden"
                  style={{
                    boxShadow:
                      "0 12px 48px -4px rgba(0,0,0,0.15), 0 4px 16px -2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* User info */}
                  <div className="px-4 pt-3.5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-display font-bold text-[0.75rem] overflow-hidden flex-shrink-0">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <p className="text-[0.8125rem] font-bold font-display text-slate-900 dark:text-white whitespace-nowrap">
                          {displayName}
                        </p>
                        <p className="text-[0.75rem] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

                  {/* Menu items */}
                  <div className="py-1.5 px-1.5">
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-[0.8125rem] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors"
                    >
                      <div className="w-[30px] h-[30px] rounded-[8px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <User size={15} />
                      </div>
                      Profile
                    </button>
                  </div>

                  <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

                  {/* Sign out */}
                  <div className="py-1.5 px-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-[0.8125rem] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[8px] transition-colors"
                    >
                      <div className="w-[30px] h-[30px] rounded-[8px] bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400">
                        <LogOut size={15} />
                      </div>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopBar;
