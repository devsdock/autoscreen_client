import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  FileText, 
  Car, 
  MapPin, 
  Clock,
  ChevronRight,
  Filter,
  Loader2
} from 'lucide-react';
import useDashboardStore, { formatDate, getRelativeTime } from '../../store/useDashboardStore';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import RequestQuoteModal from '../../components/dashboard/RequestQuoteModal';
import QuoteDetailPanel from '../../components/dashboard/QuoteDetailPanel';

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'Open', label: 'Open' },
  { id: 'Responses', label: 'Responses' },
  { id: 'Accepted', label: 'Accepted' },
  { id: 'Closed', label: 'Closed' }
];

const Quotes = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { quotes, fetchQuotes } = useDashboardStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

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
    if (routeId) {
      if (quotes.length > 0 && quotes.find(q => q.id === routeId)) {
        setSelectedQuoteId(routeId);
        // On mobile, if we have a route ID, we should show the detail panel
        if (window.innerWidth < 1024) {
          setShowMobileDetail(true);
        }
      }
    } else if (quotes.length > 0 && !selectedQuoteId) {
      // Auto-select first quote on desktop
      if (window.innerWidth >= 1024) {
        setSelectedQuoteId(quotes[0].id);
        navigate(`/dashboard/quotes/${quotes[0].id}`, { replace: true });
      }
    }
  }, [routeId, quotes, navigate, selectedQuoteId]);
  
  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    // Status filter
    if (activeFilter !== 'all' && quote.status !== activeFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const vehicle = quote.vehicle || {};
      const vehicleStr = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.toLowerCase();
      const city = quote.location?.city || '';
      
      return (
        quote.reference?.toLowerCase().includes(query) ||
        vehicleStr.includes(query) ||
        city.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
  
  const handleQuoteSelect = (quoteId) => {
    setSelectedQuoteId(quoteId);
    navigate(`/dashboard/quotes/${quoteId}`);
    setShowMobileDetail(true);
  };
  
  const handleCloseMobileDetail = () => {
    setShowMobileDetail(false);
    // On mobile, clearing the selection should reset the URL
    if (window.innerWidth < 1024) {
      navigate('/dashboard/quotes');
    }
  };
  
  const handleRequestModalClose = (newQuoteId) => {
    setShowRequestModal(false);
    if (newQuoteId) {
      setSelectedQuoteId(newQuoteId);
      navigate(`/dashboard/quotes/${newQuoteId}`);
    }
  };
  
  const getStatusCount = (status) => {
    if (status === 'all') return quotes.length;
    return quotes.filter(q => q.status === status).length;
  };
  
  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Quotes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Request quotes and compare provider offers
          </p>
        </div>
        <Button onClick={() => setShowRequestModal(true)}>
          <Plus size={18} />
          Request a Quote
        </Button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Column - Quote List */}
        <div className={`
          w-full lg:w-[400px] flex-shrink-0 flex flex-col
          ${showMobileDetail ? 'hidden lg:flex' : 'flex'}
        `}>
          {/* Search */}
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
            {statusFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${activeFilter === filter.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                {filter.label}
                <span className={`ml-1.5 ${activeFilter === filter.id ? 'text-white/70' : 'text-slate-400'}`}>
                  {getStatusCount(filter.id)}
                </span>
              </button>
            ))}
          </div>
          
          {/* Quote List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-4" />
                <p className="text-sm text-slate-500">Loading quotes...</p>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <FileText size={24} className="text-slate-400" />
                </div>
                {quotes.length === 0 ? (
                  <>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">No quotes yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Request your first quote to compare providers and get the best price
                    </p>
                    <Button onClick={() => setShowRequestModal(true)}>
                      <Plus size={16} />
                      Request Your First Quote
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">No quotes found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Try adjusting your search or filters
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredQuotes.map(quote => (
                <button
                  key={quote.id}
                  onClick={() => handleQuoteSelect(quote.id)}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all
                    ${selectedQuoteId === quote.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 ring-2 ring-primary-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm'
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
                        <StatusBadge status={quote.status} type="quote" size="sm" />
                      </div>
                      
                      {/* Service Type */}
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {quote.glassType} {quote.serviceType}
                      </p>
                      
                      {/* Vehicle */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <Car size={14} className="flex-shrink-0" />
                        <span className="truncate">
                          {quote.vehicle.year} {quote.vehicle.make} {quote.vehicle.model}
                        </span>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span>{quote.location.city}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 mb-2" />
                      
                      {/* Responses Count */}
                      {quote.responsesCount > 0 && quote.status !== 'Accepted' && (
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                          {quote.responsesCount} offer{quote.responsesCount > 1 ? 's' : ''}
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
        <div className={`
          flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col
          ${showMobileDetail ? 'fixed inset-0 z-40 lg:relative lg:inset-auto' : 'hidden lg:flex'}
        `}>
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
