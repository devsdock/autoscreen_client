import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, MapPin, Wrench, Shield, Star, Clock, ChevronRight } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import Button from '../../components/ui/Button';
import { vehicleMakes, glassTypes, serviceTypes, cities } from '../../data/quotes';
import vehicleService from '../../services/vehicleService';
import PremiumSelect from '../../components/ui/PremiumSelect';

const BookSearch = () => {
  const navigate = useNavigate();
  const { setSearchCriteria, searchCriteria, user, vehicles, addresses } = useDashboardStore();
  
  const [formData, setFormData] = useState({
    vehicleMake: searchCriteria?.vehicleMake || '',
    vehicleModel: searchCriteria?.vehicleModel || '',
    vehicleYear: searchCriteria?.vehicleYear || new Date().getFullYear().toString(),
    glassType: searchCriteria?.glassType || '',
    serviceType: searchCriteria?.serviceType || '',
    city: searchCriteria?.city || '',
    postcode: searchCriteria?.postcode || ''
  });

  // Pre-fill from saved details (Uber Style) - Only if no existing search criteria
  useEffect(() => {
    // Only pre-fill if we don't have existing criteria and form is empty
    if (user && !searchCriteria && !formData.vehicleMake) {
      const defaultVehicle = vehicles.find(v => v.isDefault) || vehicles[0];
      const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
      
      if (defaultVehicle || defaultAddress) {
        setFormData(prev => ({
          ...prev,
          vehicleMake: defaultVehicle?.make || prev.vehicleMake,
          vehicleModel: defaultVehicle?.model || prev.vehicleModel,
          vehicleYear: defaultVehicle?.year?.toString() || prev.vehicleYear,
          city: defaultAddress?.city || prev.city,
          postcode: defaultAddress?.postcode || prev.postcode
        }));
      }
    }
  }, [user, vehicles, addresses, searchCriteria]);
  
  const [errors, setErrors] = useState({});
  const [availableModels, setAvailableModels] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [suggestedField, setSuggestedField] = useState(null);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    if (field === 'vehicleMake') {
      setFormData(prev => ({ ...prev, vehicleMake: value, vehicleModel: '' }));
      setAvailableModels([]);
      setSuggestedField('vehicleModel');
    }

    if (field === 'vehicleModel') {
      setSuggestedField(null);
    }
  };

  // Fetch models dynamically
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.vehicleMake) return;
      
      setIsFetchingModels(true);
      try {
        const models = await vehicleService.getModelsByMake(formData.vehicleMake);
        setAvailableModels(models);
      } catch (err) {
        console.error('Failed to fetch models', err);
      } finally {
        setIsFetchingModels(false);
      }
    };

    fetchModels();
  }, [formData.vehicleMake]);
  
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
    navigate('/dashboard/book/request');
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
          Book a Top-Rated Provider
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Compare instant prices and book trusted service providers in your area.
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
              <PremiumSelect
                label="Make"
                required
                value={formData.vehicleMake}
                options={vehicleMakes}
                onChange={(val) => handleChange('vehicleMake', val)}
                placeholder="Select make"
                error={errors.vehicleMake}
                searchable
              />
              
              <PremiumSelect
                label="Model"
                required
                value={formData.vehicleModel}
                options={availableModels}
                onChange={(val) => handleChange('vehicleModel', val)}
                placeholder={!formData.vehicleMake ? "Select make first" : "Search model"}
                error={errors.vehicleModel}
                searchable
                disabled={!formData.vehicleMake}
                loading={isFetchingModels}
                emptyMessage={!formData.vehicleMake ? "Please select a make first" : "No models found"}
                autoOpen={suggestedField === 'vehicleModel'}
              />
              
              <PremiumSelect
                label="Year"
                value={formData.vehicleYear}
                options={years.map(String)}
                onChange={(val) => handleChange('vehicleYear', val)}
                placeholder="Select year"
              />
            </div>
          </div>
          
          {/* Service Details */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-primary-600" />
              Service Needed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumSelect
                label="Glass Type"
                required
                value={formData.glassType}
                options={glassTypes}
                onChange={(val) => handleChange('glassType', val)}
                placeholder="Select glass type"
                error={errors.glassType}
                searchable
              />
              
              <PremiumSelect
                label="Service Type"
                required
                value={formData.serviceType}
                options={serviceTypes}
                onChange={(val) => handleChange('serviceType', val)}
                placeholder="Select service"
                error={errors.serviceType}
              />
            </div>
          </div>
          
          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary-600" />
              Your Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumSelect
                label="City"
                required
                value={formData.city}
                options={cities}
                onChange={(val) => handleChange('city', val)}
                placeholder="Select city"
                error={errors.city}
                searchable
              />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Postcode (optional)
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => handleChange('postcode', e.target.value)}
                  placeholder="e.g. 2196"
                  className="w-full px-3 py-[9.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all shadow-sm text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
          
          {/* Submit */}
          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full md:w-auto px-12">
              <Search size={20} />
              Search Providers
            </Button>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5 justify-center md:justify-start">
              <Shield size={14} className="text-success-500" />
              Your request will be broadcast to all professional providers within a 50km radius.
            </p>
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



