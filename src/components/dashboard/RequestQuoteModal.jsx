import { useState, useRef } from 'react';
import { X, Upload, Image, Trash2, Calendar, Clock } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import Button from '../ui/Button';
import { vehicleMakes, glassTypes, serviceTypes, timeSlots, cities } from '../../data/quotes';

const RequestQuoteModal = ({ isOpen, onClose }) => {
  const { createQuote } = useDashboardStore();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear().toString(),
    serviceType: '',
    glassType: '',
    city: '',
    postcode: '',
    addressLine1: '',
    preferredDate: '',
    preferredTimeSlot: '',
    notes: '',
    images: []
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, { id: Date.now() + Math.random(), data: reader.result, name: file.name }]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
    if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required';
    if (!formData.vehicleYear) newErrors.vehicleYear = 'Vehicle year is required';
    if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
    if (!formData.glassType) newErrors.glassType = 'Glass type is required';
    if (!formData.city) newErrors.city = 'City is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const quoteId = createQuote({
      ...formData,
      images: formData.images.map(img => img.data)
    });
    
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: new Date().getFullYear().toString(),
      serviceType: '',
      glassType: '',
      city: '',
      postcode: '',
      addressLine1: '',
      preferredDate: '',
      preferredTimeSlot: '',
      notes: '',
      images: []
    });
    
    onClose(quoteId);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request a Quote</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Fill in the details and we'll connect you with providers
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vehicle Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Vehicle Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Make <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.vehicleMake}
                  onChange={(e) => handleChange('vehicleMake', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
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
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Model <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => handleChange('vehicleModel', e.target.value)}
                  placeholder="e.g. Corolla"
                  className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.vehicleModel ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.vehicleModel && <p className="text-xs text-danger-500 mt-1">{errors.vehicleModel}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Year <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.vehicleYear}
                  onChange={(e) => handleChange('vehicleYear', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Service Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Service Required</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Service Type <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => handleChange('serviceType', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.serviceType ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select type</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.serviceType && <p className="text-xs text-danger-500 mt-1">{errors.serviceType}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Glass Type <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.glassType}
                  onChange={(e) => handleChange('glassType', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.glassType ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select glass</option>
                  {glassTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.glassType && <p className="text-xs text-danger-500 mt-1">{errors.glassType}</p>}
              </div>
            </div>
          </div>
          
          {/* Location Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Service Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  City <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
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
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => handleChange('postcode', e.target.value)}
                  placeholder="e.g. 2196"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Address (optional)
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                placeholder="Street address for mobile service"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          
          {/* Schedule Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Preferred Schedule (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  <Calendar size={14} className="inline mr-1" /> Preferred Date
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleChange('preferredDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  <Clock size={14} className="inline mr-1" /> Preferred Time
                </label>
                <select
                  value={formData.preferredTimeSlot}
                  onChange={(e) => handleChange('preferredTimeSlot', e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Select time slot</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Describe the damage or any special requirements..."
              rows={3}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Upload Photos (Optional)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Add photos of the damage to help providers give accurate quotes
            </p>
            
            {/* Upload Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
            >
              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click to upload photos
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                PNG, JPG up to 5MB each
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {/* Image Previews */}
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {formData.images.map(img => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.data}
                      alt={img.name}
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <Button variant="secondary" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Submit Quote Request
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestQuoteModal;

