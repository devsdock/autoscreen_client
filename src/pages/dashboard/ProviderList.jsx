import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, List, Star, MapPin, Clock, Shield, Filter, 
  SlidersHorizontal, ChevronDown, Building2, User, Search, ArrowLeft
} from 'lucide-react';
import useDashboardStore, { formatCurrency } from '../../store/useDashboardStore';
import Button from '../../components/ui/Button';

const ProviderCard = ({ provider, viewMode, onSelect }) => {
  const navigate = useNavigate();
  
  const handleViewProfile = () => {
    navigate(`/dashboard/providers/${provider.id}`);
  };
  
  const lowestPrice = Math.min(...provider.services.map(s => s.fromPrice));
  const topServices = provider.services.slice(0, 3);
  
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Provider Info */}
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {provider.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{provider.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    provider.type === 'Business' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {provider.type === 'Business' ? <Building2 size={12} /> : <User size={12} />}
                    {provider.type}
                  </span>
                  {provider.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Shield size={12} /> Verified
                    </span>
                  )}
                  {provider.topRated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Star size={12} fill="currentColor" /> Top Rated
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-amber-500" fill="currentColor" />
                    <span className="font-medium text-slate-900 dark:text-white">{provider.rating}</span>
                    <span>({provider.reviewsCount} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {provider.address.city}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Services */}
            <div className="flex flex-wrap gap-2 mt-3">
              {topServices.map(service => (
                <span key={service.id} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                  {service.name}
                </span>
              ))}
              {provider.services.length > 3 && (
                <span className="px-2 py-1 text-xs text-primary-600 dark:text-primary-400">
                  +{provider.services.length - 3} more
                </span>
              )}
            </div>
          </div>
          
          {/* Price & CTA */}
          <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-6">
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">From</p>
              <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lowestPrice)}</p>
            </div>
            <Button onClick={handleViewProfile} size="sm">
              View Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Grid view
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {provider.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">{provider.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="text-amber-500" fill="currentColor" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">{provider.rating}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">({provider.reviewsCount})</span>
          </div>
        </div>
      </div>
      
      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          provider.type === 'Business' 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {provider.type === 'Business' ? <Building2 size={12} /> : <User size={12} />}
          {provider.type}
        </span>
        {provider.verified && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Shield size={12} /> Verified
          </span>
        )}
      </div>
      
      {/* Location */}
      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mb-3">
        <MapPin size={14} />
        {provider.address.city}
      </div>
      
      {/* Services */}
      <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
        {topServices.slice(0, 2).map(service => (
          <span key={service.id} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400">
            {service.name}
          </span>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">From</p>
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lowestPrice)}</p>
        </div>
        <Button onClick={handleViewProfile} size="sm">
          View
        </Button>
      </div>
    </div>
  );
};

const ProviderList = () => {
  const navigate = useNavigate();
  const { searchCriteria, searchProviders, providers } = useDashboardStore();
  
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('rating');
  const [filters, setFilters] = useState({
    type: 'all',
    minRating: 0,
    mobileService: false,
    insuranceClaims: false
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Get filtered providers
  const filteredProviders = useMemo(() => {
    let results = searchCriteria ? searchProviders(searchCriteria) : providers;
    
    // Apply filters
    if (filters.type !== 'all') {
      results = results.filter(p => p.type === filters.type);
    }
    if (filters.minRating > 0) {
      results = results.filter(p => p.rating >= filters.minRating);
    }
    if (filters.mobileService) {
      results = results.filter(p => p.mobileService);
    }
    if (filters.insuranceClaims) {
      results = results.filter(p => p.insuranceClaims);
    }
    
    // Sort
    switch (sortBy) {
      case 'rating':
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        results = [...results].sort((a, b) => {
          const minA = Math.min(...a.services.map(s => s.fromPrice));
          const minB = Math.min(...b.services.map(s => s.fromPrice));
          return minA - minB;
        });
        break;
      case 'reviews':
        results = [...results].sort((a, b) => b.reviewsCount - a.reviewsCount);
        break;
      default:
        break;
    }
    
    return results;
  }, [searchCriteria, searchProviders, providers, filters, sortBy]);
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/dashboard/book')}
          className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-3"
        >
          <ArrowLeft size={16} />
          Back to search
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Service Providers</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {filteredProviders.length} providers found
              {searchCriteria?.city && ` in ${searchCriteria.city}`}
            </p>
          </div>
          
          {/* View Toggle & Sort */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Grid size={18} />
              </button>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="rating">Highest Rated</option>
              <option value="price">Lowest Price</option>
              <option value="reviews">Most Reviews</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Provider Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="Business">Business</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Minimum Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="0">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mobileService"
                checked={filters.mobileService}
                onChange={(e) => handleFilterChange('mobileService', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="mobileService" className="text-sm text-slate-700 dark:text-slate-300">
                Mobile Service
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="insuranceClaims"
                checked={filters.insuranceClaims}
                onChange={(e) => handleFilterChange('insuranceClaims', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="insuranceClaims" className="text-sm text-slate-700 dark:text-slate-300">
                Insurance Claims
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Criteria Summary */}
      {searchCriteria && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <span className="text-primary-800 dark:text-primary-300 font-medium">Searching for:</span>
              <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
                {searchCriteria.vehicleYear} {searchCriteria.vehicleMake} {searchCriteria.vehicleModel}
              </span>
              <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
                {searchCriteria.glassType} {searchCriteria.serviceType}
              </span>
              <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
                {searchCriteria.city}
              </span>
            </div>
            <button 
              onClick={() => navigate('/dashboard/book')}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Edit Search
            </button>
          </div>
        </div>
      )}
      
      {/* Provider List */}
      {filteredProviders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No providers found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button onClick={() => navigate('/dashboard/book')}>
            New Search
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
          : 'space-y-4'
        }>
          {filteredProviders.map(provider => (
            <ProviderCard 
              key={provider.id} 
              provider={provider} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderList;

