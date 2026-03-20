import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  Car,
  Clock,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { QuoteCardSkeleton } from "../../components/skeletons/CardSkeleton";
import useDashboardStore, {
  getRelativeTimeDetailed,
  formatDateHuman,
} from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import ServiceInfoCell from "../../components/ui/ServiceInfoCell";

// Calculate remaining time until expiry
// >24h → show expiry date + time, ≤24h → show hours & minutes countdown
const getExpiryCountdown = (expiresAt) => {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry - now;

  if (diffMs <= 0) return { text: "Expired", urgent: true, expired: true };

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const dateStr = expiry.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
    const timeStr = expiry.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
    return {
      text: `Expires ${dateStr} at ${timeStr}`,
      urgent: false,
      expired: false,
    };
  }
  if (hours > 0) {
    return {
      text: `Expires in ${hours}h ${minutes}m`,
      urgent: hours < 4,
      expired: false,
    };
  }
  return {
    text: `Expires in ${minutes}m`,
    urgent: true,
    expired: false,
  };
};

const ACCEPTED_PREVIEW_COUNT = 3;
const CLOSED_PREVIEW_COUNT = 3;

// Card header gradient by section
const getHeaderGradient = (status) => {
  switch (status) {
    case "Accepted":
      return "bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-700 dark:to-emerald-900";
    case "Closed":
      return "bg-gradient-to-r from-slate-500 to-slate-700 dark:from-slate-600 dark:to-slate-800";
    default:
      return "bg-gradient-to-r from-primary-700 to-primary-900 dark:from-primary-800 dark:to-slate-900";
  }
};

// Reusable quote card component
const QuoteCard = ({ quote, onClick }) => {
  const vehicleText = `${quote.vehicle.make} ${quote.vehicle.model}${quote.vehicle.year ? ` \u00b7 ${quote.vehicle.year}` : ""}`;
  const regPlate = quote.vehicle.registrationNumber || quote.vehicle.regNumber || "";
  const paymentDue =
    quote.status === "Accepted" &&
    (quote.rawStatus === "accepting" || quote.booking?.status === "awaiting-payment");

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-600"
    >
      {/* Header */}
      <div className={`${getHeaderGradient(quote.status)} px-5 py-4 flex items-center gap-3`}>
        <div className="w-11 h-11 rounded-xl bg-white/[.12] flex items-center justify-center flex-shrink-0">
          <Car size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-base font-bold text-white truncate">
            {vehicleText}
          </div>
          {regPlate && (
            <span className="inline-block text-xs font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded mt-1">
              {regPlate}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          {paymentDue ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-600 text-xs font-semibold rounded-full">
              <span className="w-[5px] h-[5px] rounded-full bg-amber-600 flex-shrink-0" />
              Payment Due
            </span>
          ) : quote.responsesCount > 0 && quote.status !== "Accepted" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
              <span className="w-[5px] h-[5px] rounded-full bg-primary-700 flex-shrink-0" />
              {quote.responsesCount} Quote{quote.responsesCount > 1 ? "s" : ""} In
            </span>
          ) : (
            <StatusBadge
              status={quote.status}
              type="quote"
              size="sm"
            />
          )}
          <div className="text-[11px] text-white/40 font-mono mt-1.5">
            {quote.reference}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 bg-white dark:bg-slate-800 flex flex-wrap gap-x-6 gap-y-3">
        <div className="flex-1 min-w-[120px]">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Service
          </div>
          <ServiceInfoCell row={quote} />
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Location
          </div>
          <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">
            {quote.location?.city || "\u2014"}
          </div>
          {quote.location?.suburb && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {quote.location.suburb}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Providers
          </div>
          <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">
            {quote.providerCount > 0
              ? `${quote.providerCount} sent \u00b7 ${quote.responsesCount || 0} replied`
              : quote.responsesCount > 0
                ? `${quote.responsesCount} replied`
                : "Awaiting providers"}
          </div>
          {quote.providerCount > 0 && quote.providerCount > (quote.responsesCount || 0) && quote.status !== "Accepted" && quote.status !== "Closed" && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              {quote.providerCount - (quote.responsesCount || 0)} still responding
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[120px]">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Submitted
          </div>
          <div className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">
            {getRelativeTimeDetailed(quote.createdAt)}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {formatDateHuman(quote.createdAt)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {(() => {
          if (paymentDue) {
            return (
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                <Clock size={13} />
                <span>Payment required</span>
              </div>
            );
          }
          if (quote.status === "Accepted") {
            return (
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Quote accepted</span>
              </div>
            );
          }
          if (quote.status === "Closed") {
            return (
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                <XCircle size={13} />
                <span>{quote.rawStatus === "expired" ? "Expired" : "Cancelled"}</span>
              </div>
            );
          }
          if (quote.status === "Open" || quote.status === "Responses") {
            const countdown = getExpiryCountdown(quote.expiresAt);
            if (countdown) {
              return (
                <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${
                  countdown.urgent
                    ? "text-danger-600 dark:text-danger-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}>
                  <Clock size={13} />
                  <span>{countdown.text}</span>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                <Clock size={13} />
                <span>Awaiting responses</span>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              <Clock size={13} />
              <span>{quote.status}</span>
            </div>
          );
        })()}
        <span className="inline-flex items-center justify-center gap-1 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[13px] font-bold rounded-lg transition-colors">
          View Quotes <ChevronRight size={14} />
        </span>
      </div>
    </div>
  );
};

// Section header component
const SectionHeader = ({ icon: Icon, iconColor, title, count, dotColor, actions }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex items-center gap-2">
      {dotColor ? (
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      ) : (
        <Icon size={14} className={iconColor} />
      )}
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        {title}
      </h2>
    </div>
    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
      {count}
    </span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
    {actions}
  </div>
);

const QuotesNew = () => {
  const navigate = useNavigate();
  const { quotes, fetchQuotes, addToast } = useDashboardStore();

  // Separate loading states per section
  const [activeLoading, setActiveLoading] = useState(false);
  const [acceptedLoading, setAcceptedLoading] = useState(false);
  const [closedLoading, setClosedLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [, setTick] = useState(0);
  const [showAllAccepted, setShowAllAccepted] = useState(false);
  const [showAllClosed, setShowAllClosed] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [mismatchEmail, setMismatchEmail] = useState(null);

  // Update countdown every minute
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Check for Deep Link User Mismatch
  useEffect(() => {
    const mismatch = sessionStorage.getItem("deep_link_user_mismatch");
    if (mismatch) setMismatchEmail(mismatch);
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

  // Fetch all three groups in parallel on mount
  const loadAllQuotes = useCallback(async () => {
    setActiveLoading(true);
    setAcceptedLoading(true);
    setClosedLoading(true);

    await Promise.allSettled([
      fetchQuotes({ group: "active" }).finally(() => setActiveLoading(false)),
      fetchQuotes({ group: "accepted" }).finally(() => setAcceptedLoading(false)),
      fetchQuotes({ group: "closed" }).finally(() => setClosedLoading(false)),
    ]);

    setInitialLoaded(true);
  }, [fetchQuotes]);

  useEffect(() => {
    loadAllQuotes();
  }, [loadAllQuotes]);

  // Search filter
  const searchFilter = (quote) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const vehicle = quote.vehicle || {};
    const vehicleStr =
      `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.toLowerCase();
    const city = quote.location?.city || "";
    return (
      quote.reference?.toLowerCase().includes(query) ||
      vehicleStr.includes(query) ||
      city.toLowerCase().includes(query)
    );
  };

  // Split quotes into three groups
  const activeQuotes = quotes
    .filter((q) => q.status === "Open" || q.status === "Responses")
    .filter(searchFilter);

  const acceptedQuotes = quotes
    .filter((q) => q.status === "Accepted")
    .filter(searchFilter);

  const closedQuotes = quotes
    .filter((q) => q.status === "Closed")
    .filter(searchFilter);

  const acceptedToShow = showAllAccepted
    ? acceptedQuotes
    : acceptedQuotes.slice(0, ACCEPTED_PREVIEW_COUNT);
  const hiddenAcceptedCount = acceptedQuotes.length - ACCEPTED_PREVIEW_COUNT;

  const closedToShow = showAllClosed
    ? closedQuotes
    : closedQuotes.slice(0, CLOSED_PREVIEW_COUNT);
  const hiddenClosedCount = closedQuotes.length - CLOSED_PREVIEW_COUNT;

  const totalQuotes = activeQuotes.length + acceptedQuotes.length + closedQuotes.length;
  const allDoneLoading = !activeLoading && !acceptedLoading && !closedLoading;

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[1.75rem] font-bold text-slate-900 dark:text-white tracking-[-0.025em]">
            Quote Requests
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Pending requests sent to providers
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/quotes/new")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[.9375rem] font-semibold text-white tracking-[.01em] whitespace-nowrap transition-all hover:-translate-y-px hover:shadow-lg active:translate-y-0"
          style={{
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            boxShadow: "0 1px 3px rgba(15,23,42,.06), 0 1px 2px -1px rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #3B82F6, #2563EB)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(15,23,42,.08), 0 2px 4px -2px rgba(15,23,42,.05), 0 4px 14px rgba(37,99,235,.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #2563EB, #1D4ED8)";
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(15,23,42,.06), 0 1px 2px -1px rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.15)";
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Request
        </button>
      </div>

      {/* Mismatch Warning */}
      {mismatchEmail && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
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
              <strong>{useAuthStore.getState().user?.email}</strong>. The quote
              you are looking for may not be visible.
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by reference or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
        </div>
      </div>

      {/* Global empty state */}
      {allDoneLoading && initialLoaded && totalQuotes === 0 && !searchQuery ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <FileText size={24} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            No quotes yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Request your first quote to compare providers and get the best price
          </p>
          <button
            onClick={() => navigate("/dashboard/quotes/new")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[.9375rem] font-semibold text-white tracking-[.01em] whitespace-nowrap transition-all hover:-translate-y-px hover:shadow-lg active:translate-y-0"
            style={{
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              boxShadow: "0 1px 3px rgba(15,23,42,.06), 0 1px 2px -1px rgba(15,23,42,.06), inset 0 1px 0 rgba(255,255,255,.15)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Request
          </button>
        </div>
      ) : allDoneLoading && initialLoaded && totalQuotes === 0 && searchQuery ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={24} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            No quotes found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search
          </p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── 1. Active Requests (Open + Responses) ── */}
          {(activeLoading || activeQuotes.length > 0) && (
          <section>
            <SectionHeader
              dotColor="bg-primary-500 animate-pulse"
              title="Active Requests"
              count={activeLoading ? "..." : activeQuotes.length}
            />
            {activeLoading ? (
              <QuoteCardSkeleton count={2} />
            ) : activeQuotes.length > 0 && (
              <div className="space-y-4">
                {activeQuotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
          )}

          {/* ── 2. Accepted (Quote accepted, booking created) ── */}
          {(acceptedLoading || acceptedQuotes.length > 0) && (
          <section>
            <SectionHeader
              icon={CheckCircle2}
              iconColor="text-emerald-500 dark:text-emerald-400"
              title="Accepted"
              count={acceptedLoading ? "..." : acceptedQuotes.length}
              actions={
                hiddenAcceptedCount > 0 && !showAllAccepted ? (
                  <button
                    onClick={() => setShowAllAccepted(true)}
                    className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap"
                  >
                    View all &rarr;
                  </button>
                ) : null
              }
            />
            {acceptedLoading ? (
              <QuoteCardSkeleton count={2} />
            ) : acceptedQuotes.length > 0 && (
              <>
                <div className="space-y-4">
                  {acceptedToShow.map((quote) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
                    />
                  ))}
                </div>
                {hiddenAcceptedCount > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllAccepted(!showAllAccepted)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-4 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10"
                    >
                      {showAllAccepted ? (
                        <>Show less</>
                      ) : (
                        <>
                          View {hiddenAcceptedCount} more
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
          )}

          {/* ── 3. Closed (Expired + Cancelled) ── */}
          {(closedLoading || closedQuotes.length > 0) && (
          <section>
            <SectionHeader
              icon={XCircle}
              iconColor="text-slate-400 dark:text-slate-500"
              title="Closed"
              count={closedLoading ? "..." : closedQuotes.length}
              actions={
                hiddenClosedCount > 0 && !showAllClosed ? (
                  <button
                    onClick={() => setShowAllClosed(true)}
                    className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors whitespace-nowrap"
                  >
                    View all &rarr;
                  </button>
                ) : null
              }
            />
            {closedLoading ? (
              <QuoteCardSkeleton count={1} />
            ) : closedQuotes.length > 0 && (
              <>
                <div className="space-y-4">
                  {closedToShow.map((quote) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
                    />
                  ))}
                </div>
                {hiddenClosedCount > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllClosed(!showAllClosed)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-4 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10"
                    >
                      {showAllClosed ? (
                        <>Show less</>
                      ) : (
                        <>
                          View {hiddenClosedCount} more
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
          )}

        </div>
      )}
    </div>
  );
};

export default QuotesNew;
