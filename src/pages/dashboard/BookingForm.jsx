import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Car, Calendar, MapPin, MessageSquare, 
  FileText, Clock, Star, Shield, Building2, User, Plus, X, Upload, Trash2
} from 'lucide-react';
import useDashboardStore, { formatCurrency, formatDate } from '../../store/useDashboardStore';
import Button from '../../components/ui/Button';
import Modal, { ModalActions } from '../../components/ui/Modal';
import { glassTypes } from '../../data/providers';

const steps = [
  { id: 1, title: 'Service', icon: FileText },
  { id: 2, title: 'Date & Time', icon: Calendar },
  { id: 3, title: 'Address', icon: MapPin },
  { id: 4, title: 'Details', icon: MessageSquare },
  { id: 5, title: 'Review', icon: Check }
];

const BookingForm = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    getProviderById, 
    searchCriteria, 
    addresses, 
    addAddress, 
    createBookingFromFlow,
    addToast 
  } = useDashboardStore();
  
  const provider = getProviderById(providerId);
  const preSelectedService = location.state?.selectedService;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    line1: '',
    suburb: '',
    city: '',
    postcode: ''
  });
  
  const [formData, setFormData] = useState({
    // Step 1: Service & Vehicle
    service: preSelectedService || null,
    vehicle: {
      make: searchCriteria?.vehicleMake || '',
      model: searchCriteria?.vehicleModel || '',
      year: searchCriteria?.vehicleYear || new Date().getFullYear().toString()
    },
    glassType: searchCriteria?.glassType || '',
    
    // Step 2: Date & Time
    scheduledDate: '',
    timeSlot: '',
    
    // Step 3: Address
    address: null,
    
    // Step 4: Remarks & Images
    remarks: '',
    uploadedImages: []
  });
  
  const [errors, setErrors] = useState({});
  
  // Get available dates
  const availableDates = useMemo(() => {
    if (!provider?.availability) return [];
    const today = new Date().toISOString().split('T')[0];
    return provider.availability.filter(a => a.date >= today);
  }, [provider]);
  
  // Get available slots for selected date
  const availableSlots = useMemo(() => {
    if (!formData.scheduledDate || !provider?.availability) return [];
    const dateEntry = provider.availability.find(a => a.date === formData.scheduledDate);
    return dateEntry?.slots || [];
  }, [formData.scheduledDate, provider]);
  
  if (!provider) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Provider not found</h2>
        <Button onClick={() => navigate('/dashboard/providers')}>Back to Providers</Button>
      </div>
    );
  }
  
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const updateVehicle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vehicle: { ...prev.vehicle, [field]: value }
    }));
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.service) newErrors.service = 'Please select a service';
        if (!formData.vehicle.make) newErrors.vehicleMake = 'Vehicle make is required';
        if (!formData.vehicle.model) newErrors.vehicleModel = 'Vehicle model is required';
        if (!formData.glassType) newErrors.glassType = 'Glass type is required';
        break;
      case 2:
        if (!formData.scheduledDate) newErrors.scheduledDate = 'Please select a date';
        if (!formData.timeSlot) newErrors.timeSlot = 'Please select a time slot';
        break;
      case 3:
        if (!formData.address) newErrors.address = 'Please select an address';
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      id: URL.createObjectURL(file),
      url: URL.createObjectURL(file),
      name: file.name
    }));
    updateFormData('uploadedImages', [...formData.uploadedImages, ...newImages]);
  };
  
  const handleRemoveImage = (imageId) => {
    updateFormData('uploadedImages', formData.uploadedImages.filter(img => img.id !== imageId));
  };
  
  const handleAddAddress = () => {
    if (!newAddress.line1 || !newAddress.city) {
      addToast({ type: 'error', message: 'Please fill in required fields' });
      return;
    }
    const id = addAddress(newAddress);
    setFormData(prev => ({
      ...prev,
      address: { id, ...newAddress }
    }));
    setIsAddressModalOpen(false);
    setNewAddress({ label: 'Home', line1: '', suburb: '', city: '', postcode: '' });
  };
  
  const handleSubmit = () => {
    const bookingId = createBookingFromFlow({
      providerId: provider.id,
      providerName: provider.name,
      service: formData.service,
      vehicle: formData.vehicle,
      glassType: formData.glassType,
      scheduledDate: formData.scheduledDate,
      timeSlot: formData.timeSlot,
      address: formData.address,
      remarks: formData.remarks,
      uploadedImages: formData.uploadedImages.map(img => img.url)
    });
    
    navigate(`/dashboard/booking/pending/${bookingId}`);
  };
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button 
        onClick={() => navigate(`/dashboard/providers/${providerId}`)}
        className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
      >
        <ArrowLeft size={16} />
        Back to provider
      </button>
      
      {/* Provider Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {provider.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900 dark:text-white">{provider.name}</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Star size={14} className="text-amber-400" fill="currentColor" />
            {provider.rating} ({provider.reviewsCount} reviews)
            <span className="mx-1">•</span>
            <MapPin size={14} />
            {provider.address.city}
          </div>
        </div>
      </div>
      
      {/* Stepper */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 md:w-20 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Form Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        {/* Step 1: Service & Vehicle */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select a Service</h3>
              <div className="space-y-3">
                {provider.services.map(service => (
                  <div 
                    key={service.id}
                    onClick={() => updateFormData('service', service)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.service?.id === service.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{service.name}</h4>
                          {formData.service?.id === service.id && (
                            <Check size={18} className="text-primary-600 dark:text-primary-400" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{service.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={12} /> ~{service.durationMins} mins
                        </p>
                      </div>
                      <div className="text-right pl-4">
                        <p className="text-xs text-slate-500">From</p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(service.fromPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.service && <p className="text-sm text-danger-500 mt-2">{errors.service}</p>}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vehicle Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Make *</label>
                  <input
                    type="text"
                    value={formData.vehicle.make}
                    onChange={(e) => updateVehicle('make', e.target.value)}
                    placeholder="e.g. Toyota"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 ${
                      errors.vehicleMake ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.vehicleMake && <p className="text-xs text-danger-500 mt-1">{errors.vehicleMake}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Model *</label>
                  <input
                    type="text"
                    value={formData.vehicle.model}
                    onChange={(e) => updateVehicle('model', e.target.value)}
                    placeholder="e.g. Corolla"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 ${
                      errors.vehicleModel ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.vehicleModel && <p className="text-xs text-danger-500 mt-1">{errors.vehicleModel}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Year</label>
                  <select
                    value={formData.vehicle.year}
                    onChange={(e) => updateVehicle('year', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Glass Type *</label>
                <select
                  value={formData.glassType}
                  onChange={(e) => updateFormData('glassType', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
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
            </div>
          </div>
        )}
        
        {/* Step 2: Date & Time */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Date</h3>
              {availableDates.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {availableDates.map(({ date, slots }) => {
                    const dateObj = new Date(date);
                    const isSelected = formData.scheduledDate === date;
                    return (
                      <button
                        key={date}
                        onClick={() => {
                          updateFormData('scheduledDate', date);
                          updateFormData('timeSlot', '');
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                        }`}
                      >
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {dateObj.toLocaleDateString('en-ZA', { weekday: 'short' })}
                        </p>
                        <p className={`text-lg font-semibold ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>
                          {dateObj.getDate()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {dateObj.toLocaleDateString('en-ZA', { month: 'short' })}
                        </p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{slots.length} slots</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-slate-500 dark:text-slate-400">No available dates</p>
                </div>
              )}
              {errors.scheduledDate && <p className="text-sm text-danger-500 mt-2">{errors.scheduledDate}</p>}
            </div>
            
            {formData.scheduledDate && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Time Slot</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSlots.map(slot => {
                    const isSelected = formData.timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => updateFormData('timeSlot', slot)}
                        className={`px-4 py-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Clock size={16} className="inline mr-2" />
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {errors.timeSlot && <p className="text-sm text-danger-500 mt-2">{errors.timeSlot}</p>}
              </div>
            )}
          </div>
        )}
        
        {/* Step 3: Address */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Select Service Address</h3>
              <Button variant="secondary" size="sm" onClick={() => setIsAddressModalOpen(true)}>
                <Plus size={16} />
                Add New
              </Button>
            </div>
            
            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map(addr => {
                  const isSelected = formData.address?.id === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => updateFormData('address', addr)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-400">
                              {addr.label}
                            </span>
                            {isSelected && <Check size={16} className="text-primary-600 dark:text-primary-400" />}
                          </div>
                          <p className="font-medium text-slate-900 dark:text-white mt-1">{addr.line1}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {addr.suburb && `${addr.suburb}, `}{addr.city} {addr.postcode}
                          </p>
                        </div>
                        <MapPin size={20} className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <MapPin size={32} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 mb-3">No saved addresses</p>
                <Button onClick={() => setIsAddressModalOpen(true)}>
                  <Plus size={16} />
                  Add Address
                </Button>
              </div>
            )}
            {errors.address && <p className="text-sm text-danger-500 mt-2">{errors.address}</p>}
          </div>
        )}
        
        {/* Step 4: Remarks & Images */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Additional Details</h3>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Remarks or special instructions (optional)
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => updateFormData('remarks', e.target.value)}
                placeholder="e.g., Crack is on the passenger side, approximately 15cm long. Please call before arriving."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Upload photos of the damage (optional)
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-primary-600 dark:text-primary-400 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                </label>
              </div>
              
              {formData.uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {formData.uploadedImages.map(img => (
                    <div key={img.id} className="relative group">
                      <img 
                        src={img.url} 
                        alt="Upload preview" 
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Review Your Booking</h3>
            
            {/* Provider */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Provider</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold">
                  {provider.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{provider.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Star size={12} className="text-amber-400" fill="currentColor" />
                    {provider.rating} • {provider.address.city}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Service & Vehicle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Service</p>
                <p className="font-medium text-slate-900 dark:text-white">{formData.service?.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formData.glassType}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Vehicle</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formData.vehicle.year} {formData.vehicle.make} {formData.vehicle.model}
                </p>
              </div>
            </div>
            
            {/* Date & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Date & Time</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formatDate(formData.scheduledDate, 'long')}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formData.timeSlot}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Address</p>
                <p className="font-medium text-slate-900 dark:text-white">{formData.address?.line1}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.address?.suburb && `${formData.address.suburb}, `}
                  {formData.address?.city} {formData.address?.postcode}
                </p>
              </div>
            </div>
            
            {/* Remarks & Images */}
            {(formData.remarks || formData.uploadedImages.length > 0) && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Additional Details</p>
                {formData.remarks && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{formData.remarks}</p>
                )}
                {formData.uploadedImages.length > 0 && (
                  <div className="flex gap-2">
                    {formData.uploadedImages.slice(0, 4).map(img => (
                      <img 
                        key={img.id}
                        src={img.url} 
                        alt="Upload" 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ))}
                    {formData.uploadedImages.length > 4 && (
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
                        +{formData.uploadedImages.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Price Estimate */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
              <p className="text-xs text-primary-600 dark:text-primary-400 mb-2 font-medium">Price Estimate</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Service</span>
                  <span>{formatCurrency(formData.service?.fromPrice || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Platform fee (5%)</span>
                  <span>{formatCurrency(Math.round((formData.service?.fromPrice || 0) * 0.05))}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900 dark:text-white pt-2 border-t border-primary-200 dark:border-primary-700">
                  <span>Total</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {formatCurrency((formData.service?.fromPrice || 0) + Math.round((formData.service?.fromPrice || 0) * 0.05))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          {currentStep > 1 ? (
            <Button variant="secondary" onClick={handleBack}>
              <ArrowLeft size={18} />
              Back
            </Button>
          ) : (
            <div />
          )}
          
          {currentStep < 5 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Check size={18} />
              Send Booking Request
            </Button>
          )}
        </div>
      </div>
      
      {/* Add Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add New Address"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Label</label>
            <select
              value={newAddress.label}
              onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Street Address *</label>
            <input
              type="text"
              value={newAddress.line1}
              onChange={(e) => setNewAddress(prev => ({ ...prev, line1: e.target.value }))}
              placeholder="123 Main Road"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Suburb</label>
            <input
              type="text"
              value={newAddress.suburb}
              onChange={(e) => setNewAddress(prev => ({ ...prev, suburb: e.target.value }))}
              placeholder="Sandton"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City *</label>
              <input
                type="text"
                value={newAddress.city}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Johannesburg"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Postcode</label>
              <input
                type="text"
                value={newAddress.postcode}
                onChange={(e) => setNewAddress(prev => ({ ...prev, postcode: e.target.value }))}
                placeholder="2196"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setIsAddressModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAddress}>Add Address</Button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default BookingForm;


