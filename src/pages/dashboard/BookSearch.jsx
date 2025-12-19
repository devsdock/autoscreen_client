import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, MapPin, Wrench, Shield, Star, Clock, ChevronRight } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import Button from '../../components/ui/Button';
import { vehicleMakes, glassTypes, serviceTypes, cities } from '../../data/providers';

const BookSearch = () => {
  const navigate = useNavigate();
  const { setSearchCriteria } = useDashboardStore();
  
  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear().toString(),
    glassType: '',
    serviceType: '',
    city: '',
    postcode: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
    if (!formData.vehicleModel) newErrors.vehicleModel = 'Model is required';
    if (!formData.glassType) newErrors.glassType = 'Glass type is required';
    if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
    if (!formData.city) newErrors.city = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSearchCriteria(formData);
    navigate('/dashboard/providers');
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-full text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
          <Shield size={16} />
          Trusted by 10,000+ South African drivers
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Find & Book Auto Glass Services
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Compare prices, read reviews, and book trusted auto glass technicians in your area
        </p>
      </div>
      
      {/* Search Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 md:p-8 mb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Car size={20} className="text-primary-600" />
              Vehicle Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Make <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.vehicleMake}
                  onChange={(e) => handleChange('vehicleMake', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors ${
                    errors.vehicleMake ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select make</option>
                  {vehicleMakes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
                {errors.vehicleMake && <p className="text-xs text-danger-500 mt-1">{errors.vehicleMake}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Model <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => handleChange('vehicleModel', e.target.value)}
                  placeholder="e.g. Corolla, Golf, Polo"
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors ${
                    errors.vehicleModel ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.vehicleModel && <p className="text-xs text-danger-500 mt-1">{errors.vehicleModel}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Year
                </label>
                <select
                  value={formData.vehicleYear}
                  onChange={(e) => handleChange('vehicleYear', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Service Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-primary-600" />
              Service Needed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Glass Type <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.glassType}
                  onChange={(e) => handleChange('glassType', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors ${
                    errors.glassType ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select glass type</option>
                  {glassTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.glassType && <p className="text-xs text-danger-500 mt-1">{errors.glassType}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Service Type <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => handleChange('serviceType', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors ${
                    errors.serviceType ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select service</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.serviceType && <p className="text-xs text-danger-500 mt-1">{errors.serviceType}</p>}
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary-600" />
              Your Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  City <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors ${
                    errors.city ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select city</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <p className="text-xs text-danger-500 mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Postcode (optional)
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => handleChange('postcode', e.target.value)}
                  placeholder="e.g. 2196"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
          </div>
          
          {/* Submit */}
          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full md:w-auto px-12">
              <Search size={20} />
              Find Providers
            </Button>
          </div>
        </form>
      </div>
      
      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star size={24} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Verified Providers</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            All providers are vetted and rated by real customers
          </p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-success-600 dark:text-success-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Quality Guaranteed</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Warranty-backed workmanship on all services
          </p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-warning-600 dark:text-warning-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Same-Day Service</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Many providers offer same-day appointments
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookSearch;

