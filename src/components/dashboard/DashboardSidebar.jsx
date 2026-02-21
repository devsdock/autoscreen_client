import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  Search,
  HelpCircle,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";

import logo from "../../assets/logo.png";
import logoIcon from "../../assets/logo_icon.png";
import logoWhite from "../../assets/logo_white.png";
import logoIconWhite from "../../assets/logo_icon_white.png";

const mainMenuItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { path: "/dashboard/book", icon: Search, label: "Book Now" },
  { path: "/dashboard/quotes", icon: FileText, label: "Request Quotes" },
  { path: "/dashboard/bookings", icon: Calendar, label: "My Bookings" },
  { path: "/dashboard/payments", icon: CreditCard, label: "Payments" },
  // {
  //   path: "/dashboard/messages",
  //   icon: MessageSquare,
  //   label: "Messages",
  //   badge: 2,
  // },
  { path: "/dashboard/support", icon: HelpCircle, label: "Support" },
];

const generalItems = [
  { path: "/dashboard/profile", icon: Settings, label: "Settings" },
];

const DashboardSidebar = () => {
  const {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapse,
    addToast,
    quotes,
    bookings,
  } = useDashboardStore();
  const logout = useAuthStore((state) => state.logout);
  const [hoveredItem, setHoveredItem] = useState(null);

  const getBadgeCount = (label) => {
    switch (label) {
      case "Request Quotes":
      case "My Quotes": // fallback in case name changes
        return (
          quotes?.filter(
            (q) =>
              ![
                "Closed",
                "Cancelled",
                "closed",
                "cancelled",
                "Accepted",
                "accepted",
              ].includes(q.status),
          )?.length || 0
        );
      case "My Bookings":
        return (
          bookings?.filter(
            (b) =>
              !["Completed", "Cancelled", "completed", "cancelled"].includes(
                b.status,
              ),
          )?.length || 0
        );
      default:
        return 0;
    }
  };

  const handleMouseEnter = (label, e) => {
    if (!sidebarCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({
      label,
      top: rect.top,
      left: rect.right,
      height: rect.height,
    });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleLogout = async () => {
    addToast({ type: "info", message: "Logging out..." });
    sessionStorage.removeItem("action_banner_dismissed");
    await logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen
          bg-white dark:bg-slate-900
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[240px]"}
          w-[240px]
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
          border-r border-slate-100 dark:border-slate-800
          overflow-visible
        `}
      >
        {/* Logo & Toggle */}
        <div
          className={`h-16 flex items-center ${
            sidebarCollapsed ? "justify-center px-1" : "justify-between px-4"
          } relative transition-all duration-300`}
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
          >
            {sidebarCollapsed ? (
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img
                  src={logoIcon}
                  alt="AutoScreen"
                  className="w-full h-full object-contain dark:hidden"
                />
                <img
                  src={logoIconWhite}
                  alt="AutoScreen"
                  className="w-full h-full object-contain hidden dark:block"
                />
              </div>
            ) : (
              <>
                <img
                  src={logo}
                  alt="AutoScreen"
                  className="h-8 object-contain dark:hidden"
                />
                <img
                  src={logoWhite}
                  alt="AutoScreen"
                  className="h-8 object-contain hidden dark:block"
                />
              </>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>

          {/* Collapse toggle for desktop */}
          <button
            onClick={toggleSidebarCollapse}
            className={`
              hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors
              ${
                sidebarCollapsed
                  ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 z-50 rounded-full w-6 h-6 items-center justify-center"
                  : ""
              }
            `}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
          {/* Main Menu Section */}
          <div className="mb-6">
            {!sidebarCollapsed && (
              <p className="px-3 mb-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Main Menu
              </p>
            )}
            {sidebarCollapsed && (
              <div className="mb-3 border-t border-slate-100 dark:border-slate-800 mx-2" />
            )}

            <ul className="space-y-1">
              {mainMenuItems.map(({ path, icon: Icon, label, end, badge }) => {
                const badgeCount = badge || getBadgeCount(label);

                return (
                  <li key={path}>
                    <NavLink
                      to={path}
                      end={end}
                      onClick={() => {
                        if (window.innerWidth < 1024) toggleSidebar();
                      }}
                      onMouseEnter={(e) => handleMouseEnter(label, e)}
                      onMouseLeave={handleMouseLeave}
                      className={({ isActive }) => `
                        flex items-center rounded-lg
                        transition-all duration-200 group relative
                        ${
                          isActive
                            ? "bg-primary-600 text-white shadow-sm font-medium"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }
                        ${sidebarCollapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3 py-2.5"}
                      `}
                    >
                      <div className="relative">
                        <Icon size={20} className="flex-shrink-0" />
                        {sidebarCollapsed && badgeCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}
                      </div>

                      {!sidebarCollapsed && (
                        <span className="font-medium whitespace-nowrap">
                          {label}
                        </span>
                      )}

                      {/* Badge for expanded state */}
                      {!sidebarCollapsed && badgeCount > 0 && (
                        <span
                          className={`
                            ml-auto flex h-5 w-auto min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold
                            bg-red-500 text-white shadow-sm
                          `}
                        >
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* General Section */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 mb-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                General
              </p>
            )}
            {sidebarCollapsed && (
              <div className="mb-3 border-t border-slate-100 dark:border-slate-800 mx-2" />
            )}

            <ul className="space-y-1">
              {generalItems.map(({ path, icon: Icon, label }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    onMouseEnter={(e) => handleMouseEnter(label, e)}
                    onMouseLeave={handleMouseLeave}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 group relative
                      ${
                        isActive
                          ? "bg-primary-600 text-white shadow-sm font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }
                      ${sidebarCollapsed ? "justify-center" : ""}
                    `}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="font-medium whitespace-nowrap">
                        {label}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}

              {/* Logout */}
              <li>
                <button
                  onClick={handleLogout}
                  onMouseEnter={(e) => handleMouseEnter("Log out", e)}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
                    text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group relative
                    ${sidebarCollapsed ? "justify-center" : ""}
                  `}
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium whitespace-nowrap">
                      Log out
                    </span>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Global Floating Tooltip */}
        {hoveredItem && sidebarCollapsed && (
          <div
            className="fixed z-50 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-lg shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-2"
            style={{
              top: hoveredItem.top + hoveredItem.height / 2 - 16,
              left: hoveredItem.left + 8,
            }}
          >
            {hoveredItem.label}
            {getBadgeCount(hoveredItem.label) > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-[10px] rounded-full font-bold">
                {getBadgeCount(hoveredItem.label)}
              </span>
            )}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800 dark:border-r-slate-700" />
          </div>
        )}
      </aside>
    </>
  );
};

export default DashboardSidebar;
