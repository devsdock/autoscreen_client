import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Phone, Mail, Shield, Building2, User, 
  Clock, ChevronRight, Calendar, Check, Truck, FileCheck, Image
} from 'lucide-react';
import useDashboardStore, { formatCurrency, formatDate } from '../../store/useDashboardStore';
import { formatDuration } from '../../utils/formatDuration';
import Button from '../../components/ui/Button';
import { getTodayString } from '../../utils/dateUtils';

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProviderById, getProviderReviews, searchCriteria } = useDashboardStore();
  
  const provider = getProviderById(id);
  const reviews = getProviderReviews(id);
  
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 6);
  
  // Get next available slots
  const nextAvailableSlots = useMemo(() => {
    if (!provider?.availability) return [];
    const today = getTodayString();
    return provider.availability
      .filter(a => a.date >= today)
      .slice(0, 3)
      .map(a => ({
        date: a.date,
        slotsCount: a.slots.length,
        firstSlot: a.slots[0]
      }));
  }, [provider]);
  
  if (!provider) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Provider not found</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">The provider you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/dashboard/providers')}>
          Back to Providers
        </Button>
      </div>
    );
  }
  
  const handleBookNow = () => {
    navigate(`/dashboard/book/${provider.id}`, { 
      state: { 
        selectedService,
        searchCriteria 
      } 
    });
  };
  
  return (
    <div>
      {/* Back Button */}
      <button 
        onClick={() => navigate('/dashboard/providers')}
        className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
      >
        <ArrowLeft size={16} />
        Back to providers
      </button>
      
      {/* Provider Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Provider Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                {provider.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{provider.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    provider.type === 'Business' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {provider.type === 'Business' ? <Building2 size={12} /> : <User size={12} />}
                    {provider.type}
                  </span>
                  {provider.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Shield size={12} /> Verified
                    </span>
                  )}
                  {provider.topRated && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Star size={12} fill="currentColor" /> Top Rated
                    </span>
                  )}
                </div>
                
                {/* Rating */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star 
                        key={i} 
                        size={18} 
                        className={i <= Math.round(provider.rating) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}
                        fill={i <= Math.round(provider.rating) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{provider.rating}</span>
                  <span className="text-slate-500 dark:text-slate-400">({provider.reviewsCount} reviews)</span>
                </div>
                
                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} />
                    {provider.address.line1}, {provider.address.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={16} />
                    {provider.phone}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {provider.mobileService && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                  <Truck size={16} className="text-primary-600 dark:text-primary-400" />
                  Mobile Service
                </span>
              )}
              {provider.insuranceClaims && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                  <FileCheck size={16} className="text-primary-600 dark:text-primary-400" />
                  Insurance Claims
                </span>
              )}
            </div>
          </div>
          
          {/* Right: Availability Summary & CTA */}
          <div className="lg:w-72 bg-slate-50 dark:bg-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Next Available</h3>
            {nextAvailableSlots.length > 0 ? (
              <div className="space-y-2 mb-4">
                {nextAvailableSlots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatDate(slot.date, 'short')}
                    </span>
                    <span className="text-primary-600 dark:text-primary-400 font-medium">
                      {slot.slotsCount} slots
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No slots available</p>
            )}
            <Button onClick={handleBookNow} className="w-full">
              <Calendar size={18} />
              Book Now
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {['services', 'reviews', 'about', 'gallery'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Available Services</h3>
              {provider.services.map(service => (
                <div 
                  key={service.id}
                  onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedService?.id === service.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{service.name}</h4>
                        {selectedService?.id === service.id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400">
                            <Check size={12} /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{service.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          ~{formatDuration(service.durationMins)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">From</p>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(service.fromPrice)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {selectedService && (
                <div className="flex justify-end pt-4">
                  <Button onClick={handleBookNow}>
                    Continue with {selectedService.name}
                    <ChevronRight size={18} />
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Customer Reviews</h3>
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-amber-400" fill="currentColor" />
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{provider.rating}</span>
                  <span className="text-slate-500 dark:text-slate-400">({reviews.length} reviews)</span>
                </div>
              </div>
              
              {reviews.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No reviews yet</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {displayedReviews.map(review => (
                      <div key={review.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                              {review.authorName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{review.authorName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(review.createdAt, 'short')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star 
                                key={i} 
                                size={14} 
                                className={i <= review.rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}
                                fill={i <= review.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                  
                  {reviews.length > 6 && (
                    <div className="text-center mt-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowAllReviews(!showAllReviews)}
                      >
                        {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* About Tab */}
          {activeTab === 'about' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About {provider.name}</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">{provider.about}</p>
              
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Service Areas</h4>
              <div className="flex flex-wrap gap-2">
                {provider.serviceAreas.map((area, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                    {area}
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin size={16} className="text-slate-400" />
                      {provider.address.line1}, {provider.address.city}, {provider.address.postcode}
                    </p>
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone size={16} className="text-slate-400" />
                      {provider.phone}
                    </p>
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail size={16} className="text-slate-400" />
                      {provider.email}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Features</h4>
                  <div className="space-y-2">
                    {provider.mobileService && (
                      <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check size={16} className="text-green-500" />
                        Mobile service available
                      </p>
                    )}
                    {provider.insuranceClaims && (
                      <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check size={16} className="text-green-500" />
                        Insurance claims accepted
                      </p>
                    )}
                    {provider.verified && (
                      <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check size={16} className="text-green-500" />
                        Verified provider
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Gallery</h3>
              {provider.galleryImages?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {provider.galleryImages.map((img, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={img} 
                        alt={`${provider.name} gallery ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No gallery images available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;



