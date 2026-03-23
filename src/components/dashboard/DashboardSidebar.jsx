import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Car,
  FileText,
  Calendar,
  CircleUser,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Plus,
  HelpCircle,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";

import logo from "../../assets/logo.png";
import logoIcon from "../../assets/logo_icon.png";
import logoWhite from "../../assets/logo_white.png";
import logoIconWhite from "../../assets/logo_icon_white.png";

// Top-level nav (no section label)
const topItems = [
  { path: "/dashboard", icon: LayoutGrid, label: "Home", end: true },
];

// My AutoScreen section
const autoScreenItems = [
  { path: "/dashboard/vehicles", icon: Car, label: "My Vehicles" },
  { path: "/dashboard/quotes", icon: FileText, label: "Quote Requests" },
  { path: "/dashboard/bookings", icon: Calendar, label: "My Bookings" },
];

// Account section
const accountItems = [
  { path: "/dashboard/profile", icon: CircleUser, label: "My Profile" },
  { path: "/dashboard/insurance", icon: ShieldCheck, label: "Insurance" },
];

// Support section
const supportItems = [
  { path: "/dashboard/support", icon: HelpCircle, label: "Support" },
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
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [collapseTooltip, setCollapseTooltip] = useState(null);
  const getBadgeCount = (label) => {
    switch (label) {
      case "Quote Requests":
        return (
          quotes?.filter(
            (q) =>
              q.status === "Responses" ||
              (q.status === "Accepted" &&
                q.booking?.status === "awaiting-payment"),
          )?.length || 0
        );
      case "My Bookings":
        return (
          bookings?.filter((b) => {
            const s = b.status?.toLowerCase();
            const actionRequired =
              s === "awaiting-customer-approval" ||
              (s === "searching" &&
                (b.quotes?.length > 0 || b.suggestions?.length > 0));
            return actionRequired;
          })?.length || 0
        );
      default:
        return 0;
    }
  };

  // Badge style: "red" for Quote Requests, "soft" (blue) for My Bookings
  const getBadgeStyle = (label) => {
    if (label === "My Bookings") return "soft";
    return "red";
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
    sessionStorage.removeItem("dismissed_completed_bookings");
    await logout();
  };

  // Render a nav item with HTML-design active style (blue left bar + blue bg)
  const renderNavItem = ({ path, icon: Icon, label, end }) => {
    const badgeCount = getBadgeCount(label);
    const badgeStyle = getBadgeStyle(label);

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
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }
            ${sidebarCollapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3 py-2.5"}
          `}
        >
          {({ isActive }) => (
            <>
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-primary-600 rounded-r-sm" />
              )}

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
                <span className="font-medium whitespace-nowrap">{label}</span>
              )}

              {/* Badge for expanded state */}
              {!sidebarCollapsed && badgeCount > 0 && (
                <span
                  className={`
                    ml-auto flex h-5 w-auto min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold
                    ${
                      badgeStyle === "soft"
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                        : "bg-red-500 text-white shadow-sm"
                    }
                  `}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </>
          )}
        </NavLink>
      </li>
    );
  };

  // Render a section with optional label
  const renderSection = (label, items) => (
    <div className="mb-4">
      {label && !sidebarCollapsed && (
        <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      )}
      {label && sidebarCollapsed && (
        <div className="mb-2 border-t border-slate-100 dark:border-slate-800 mx-2" />
      )}
      <ul className="space-y-0.5">{items.map(renderNavItem)}</ul>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[39] lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          bg-white dark:bg-slate-900
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          flex flex-col
          ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
          w-[260px]
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
          border-r border-slate-200 dark:border-slate-800
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
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setCollapseTooltip({
                label: sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar",
                top: rect.top,
                left: rect.right,
                height: rect.height,
              });
            }}
            onMouseLeave={() => setCollapseTooltip(null)}
            className={`
              hidden lg:flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-all duration-200
              ${sidebarCollapsed
                ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 shadow-card border border-slate-200 dark:border-slate-700 z-50 rounded-full w-6 h-6"
                : "ml-auto p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              }
            `}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={14} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
          {/* Home (no section label) */}
          {renderSection(null, topItems)}

          {/* My AutoScreen */}
          {renderSection("My AutoScreen", autoScreenItems)}

          {/* Account */}
          {renderSection("Account", accountItems)}

          {/* Support & Chat */}
          {renderSection("Support", supportItems)}

          {/* Logout */}
          <div className="mt-2">
            {sidebarCollapsed && (
              <div className="mb-2 border-t border-slate-100 dark:border-slate-800 mx-2" />
            )}
            <ul>
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

        {/* Get a Quote CTA */}
        {!sidebarCollapsed && (
          <div className="p-3">
            <button
              onClick={() => navigate("/dashboard/quotes/new")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-[15px] shadow-md hover:from-primary-500 hover:to-primary-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus size={16} />
              Get a Quote
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="p-2">
            <button
              onClick={() => navigate("/dashboard/quotes/new")}
              onMouseEnter={(e) => handleMouseEnter("Get a Quote", e)}
              onMouseLeave={handleMouseLeave}
              className="w-full flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md hover:from-primary-500 hover:to-primary-600 transition-all duration-200"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* Collapse Toggle Tooltip */}
        {collapseTooltip && (
          <div
            className="fixed z-[200] px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
            style={{
              top: collapseTooltip.top + collapseTooltip.height / 2 - 16,
              left: collapseTooltip.left + 8,
            }}
          >
            {collapseTooltip.label}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800 dark:border-r-slate-700" />
          </div>
        )}

        {/* Collapsed Nav Tooltip */}
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
