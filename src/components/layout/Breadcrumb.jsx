import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutGrid } from "lucide-react";

const ROUTE_LABELS = {
  overview: "Home",
  quotes: "Quote Requests",
  bookings: "My Bookings",
  payments: "Payments",
  vehicles: "My Vehicles",
  insurance: "Insurance",
  profile: "My Profile",
  support: "Support",
  messages: "Messages",
};

const Breadcrumb = () => {
  const location = useLocation();
  const segments = location.pathname
    .replace(/^\/dashboard\/?/, "")
    .split("/")
    .filter(Boolean);

  // On overview/home, just show "Dashboard"
  if (
    segments.length === 0 ||
    (segments.length === 1 && segments[0] === "overview")
  ) {
    return (
      <nav className="flex items-center gap-2 text-[0.875rem]">
        <span className="flex items-center gap-2">
          <LayoutGrid
            size={14}
            className="text-slate-400 dark:text-slate-500 mr-0.5"
          />
          <span className="font-medium text-slate-900 dark:text-white">
            Dashboard
          </span>
        </span>
      </nav>
    );
  }

  const crumbs = [{ label: "Dashboard", path: "/dashboard" }];

  let currentPath = "/dashboard";
  segments.forEach((seg, i) => {
    currentPath += `/${seg}`;
    const label = ROUTE_LABELS[seg];
    if (label) {
      crumbs.push({ label, path: currentPath });
    } else if (seg === "new") {
      crumbs.push({ label: "New", path: currentPath });
    } else if (seg === "edit") {
      crumbs.push({ label: "Edit", path: currentPath });
    } else if (seg === "book-appointment") {
      crumbs.push({ label: "Book Appointment", path: currentPath });
    } else if (i > 0) {
      crumbs.push({ label: "Details", path: currentPath });
    }
  });

  return (
    <nav className="flex items-center gap-2 text-[0.875rem]">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} className="flex items-center gap-2">
            {i === 0 && (
              <LayoutGrid
                size={14}
                className="text-slate-400 dark:text-slate-500 mr-0.5"
              />
            )}
            {i > 0 && (
              <ChevronRight
                size={13}
                className="text-slate-300 dark:text-slate-600"
              />
            )}
            {isLast ? (
              <span className="font-medium text-slate-900 dark:text-white">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
