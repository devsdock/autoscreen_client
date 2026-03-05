import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  Car,
  MapPin,
  Clock,
  ChevronRight,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { CardSkeleton } from "../../components/skeletons/CardSkeleton";
import useDashboardStore, {
  formatDate,
  getRelativeTime,
} from "../../store/useDashboardStore";
import useAuthStore from "../../store/useAuthStore";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import ServiceInfoCell from "../../components/ui/ServiceInfoCell";
import RequestQuoteModal from "../../components/dashboard/RequestQuoteModal";
import QuoteDetailPanel from "../../components/dashboard/QuoteDetailPanel";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "Open", label: "Open" },
  { id: "Responses", label: "Responses" },
  { id: "Accepted", label: "Accepted" },
  { id: "Closed", label: "Closed" },
];

const Quotes = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { quotes, fetchQuotes, fetchQuoteDetails, addToast } = useDashboardStore();
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Open");
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [mismatchEmail, setMismatchEmail] = useState(null);

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

  useEffect(() => {
    const loadQuotes = async () => {
      setIsLoading(true);
      await fetchQuotes();
      setIsLoading(false);
    };
    loadQuotes();
  }, [fetchQuotes]);

  // Handle URL params for quote selection
  useEffect(() => {
    const checkAndFetchQuote = async () => {
      if (routeId) {
        const found = quotes.find((q) => q.id === routeId);
        if (found) {
          setSelectedQuoteId(found.id);
          // If the found quote has a different status than active filter, switch to All or its status
          // ONLY if this is a new selection (routeId changed from something else)
          if (
            activeFilter !== "all" &&
            found.status !== activeFilter &&
            selectedQuoteId !== routeId
          ) {
            setActiveFilter("all");
          }
          if (window.innerWidth < 1024) {
            setShowMobileDetail(true);
          }
        } else {
          // If not found in store, fetch specifically
          setIsLoading(true);
          const fetched = await fetchQuoteDetails(routeId);
          if (fetched) {
            setSelectedQuoteId(routeId);
            if (
              activeFilter !== "all" &&
              fetched.status !== activeFilter &&
              selectedQuoteId !== routeId
            ) {
              setActiveFilter("all");
            }
            if (window.innerWidth < 1024) {
              setShowMobileDetail(true);
            }
          } else {
            // Quote not found or not accessible — redirect to quotes list
            addToast("Quote not found or belongs to a different account.", "error");
            navigate("/dashboard/quotes", { replace: true });
          }
          setIsLoading(false);
        }
      } else if (quotes.length > 0 && !selectedQuoteId) {
        // Auto-select first quote on desktop that matches the active filter
        if (window.innerWidth >= 1024) {
          const matchingQuotes =
            activeFilter === "all"
              ? quotes
              : quotes.filter((q) => q.status === activeFilter);
          if (matchingQuotes.length > 0) {
            setSelectedQuoteId(matchingQuotes[0].id);
            navigate(`/dashboard/quotes/${matchingQuotes[0].id}`, {
              replace: true,
            });
          }
        }
      }
    };

    checkAndFetchQuote();
  }, [
    routeId,
    quotes,
    navigate,
    selectedQuoteId,
    fetchQuoteDetails,
    activeFilter,
  ]);

  // Filter quotes
  const filteredQuotes = quotes.filter((quote) => {
    // Status filter
    if (activeFilter !== "all" && quote.status !== activeFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
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
    }

    return true;
  });

  // When filter changes, clear selection if the selected quote doesn't match the filter
  useEffect(() => {
    if (selectedQuoteId && activeFilter !== "all") {
      const selectedQ = quotes.find((q) => q.id === selectedQuoteId);
      if (selectedQ && selectedQ.status !== activeFilter) {
        // Selected quote doesn't match filter - try to select first matching quote
        const firstMatch = filteredQuotes[0];
        if (firstMatch) {
          setSelectedQuoteId(firstMatch.id);
          navigate(`/dashboard/quotes/${firstMatch.id}`, { replace: true });
        } else {
          setSelectedQuoteId(null);
          navigate(`/dashboard/quotes`, { replace: true });
        }
      }
    }
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId);

  const handleQuoteSelect = (quoteId) => {
    setSelectedQuoteId(quoteId);
    navigate(`/dashboard/quotes/${quoteId}`);
    setShowMobileDetail(true);
  };

  const handleCloseMobileDetail = () => {
    setShowMobileDetail(false);
    // On mobile, clearing the selection should reset the URL
    if (window.innerWidth < 1024) {
      navigate("/dashboard/quotes");
    }
  };

  const handleRequestModalClose = async (newQuoteId) => {
    setShowRequestModal(false);
    if (newQuoteId) {
      // Refresh the list to show the new quote
      setIsLoading(true);
      await fetchQuotes();
      setIsLoading(false);

      setSelectedQuoteId(newQuoteId);
      navigate(`/dashboard/quotes/${newQuoteId}`);
    }
  };

  const getStatusCount = (status) => {
    if (status === "all") return quotes.length;
    return quotes.filter((q) => q.status === status).length;
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Request Quotes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Request quotes and compare provider offers
          </p>
        </div>
        <Button onClick={() => setShowRequestModal(true)}>
          <Plus size={18} />
          Request a Quote
        </Button>
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

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Column - Quote List */}
        <div
          className={`
          w-full lg:w-[400px] flex-shrink-0 flex flex-col
          ${showMobileDetail ? "hidden lg:flex" : "flex"}
        `}
        >
          {/* Search */}
          <div className="relative mb-4">
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

          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    activeFilter === filter.id
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }
                `}
              >
                {filter.label}
                <span
                  className={`ml-1.5 ${activeFilter === filter.id ? "text-white/70" : "text-slate-400"}`}
                >
                  {getStatusCount(filter.id)}
                </span>
              </button>
            ))}
          </div>

          {/* Quote List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              <CardSkeleton count={3} />
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  {quotes.length === 0 ? (
                    <FileText size={24} className="text-slate-400" />
                  ) : (
                    <AlertCircle size={24} className="text-slate-400" />
                  )}
                </div>
                {quotes.length === 0 ? (
                  <>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      No quotes yet
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Request your first quote to compare providers and get the
                      best price
                    </p>
                    <Button onClick={() => setShowRequestModal(true)}>
                      <Plus size={16} />
                      Request Your First Quote
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      No quotes found
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Try adjusting your search or filters
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() => handleQuoteSelect(quote.id)}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all
                    ${
                      selectedQuoteId === quote.id
                        ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 ring-2 ring-primary-500/20"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Reference & Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {quote.reference}
                        </span>
                        <StatusBadge
                          status={quote.status}
                          type="quote"
                          size="sm"
                        />
                      </div>

                      {/* Service Type */}
                      <div className="flex flex-col gap-1 mt-1.5 mb-1.5 grayscale-[0.3]">
                        <ServiceInfoCell row={quote} />
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <Car size={14} className="flex-shrink-0" />
                        <span className="truncate">
                          {quote.vehicle.year} {quote.vehicle.make}{" "}
                          {quote.vehicle.model}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span>{quote.location.city}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <ChevronRight
                        size={18}
                        className="text-slate-300 dark:text-slate-600 mb-2"
                      />

                      {/* Responses Count */}
                      {quote.responsesCount > 0 &&
                        quote.status !== "Accepted" && (
                          <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                            {quote.responsesCount} offer
                            {quote.responsesCount > 1 ? "s" : ""}
                          </span>
                        )}

                      {/* Date */}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        {getRelativeTime(quote.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Quote Detail */}
        <div
          className={`
          flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col
          ${showMobileDetail ? "fixed inset-0 z-40 lg:relative lg:inset-auto" : "hidden lg:flex"}
        `}
        >
          <QuoteDetailPanel
            quote={selectedQuote}
            onClose={handleCloseMobileDetail}
          />
        </div>
      </div>

      {/* Request Quote Modal */}
      <RequestQuoteModal
        isOpen={showRequestModal}
        onClose={handleRequestModalClose}
      />
    </div>
  );
};

export default Quotes;
