import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal, { ModalActions } from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import useDashboardStore from '../../store/useDashboardStore';
import { vehicleMakes, yearOptions } from '../../data/vehicles';
import { glassTypes, serviceTypes, locationTypes } from '../../data/quotes';
import { cities } from '../../data/addresses';

const NewQuoteModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { vehicles, addresses, createQuote } = useDashboardStore();
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    glassType: '',
    serviceType: 'Replacement',
    locationType: 'Mobile',
    addressId: '',
    streetAddress: '',
    suburb: '',
    city: 'Johannesburg',
    notes: ''
  });
  
  const [useExistingVehicle, setUseExistingVehicle] = useState(vehicles.length > 0);
  const [useExistingAddress, setUseExistingAddress] = useState(addresses.length > 0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (useExistingVehicle) {
      if (!formData.vehicleId) newErrors.vehicleId = 'Please select a vehicle';
    } else {
      if (!formData.vehicleMake) newErrors.vehicleMake = 'Required';
      if (!formData.vehicleModel) newErrors.vehicleModel = 'Required';
      if (!formData.vehicleYear) newErrors.vehicleYear = 'Required';
    }
    
    if (!formData.glassType) newErrors.glassType = 'Required';
    
    if (useExistingAddress) {
      if (!formData.addressId) newErrors.addressId = 'Please select an address';
    } else {
      if (!formData.streetAddress) newErrors.streetAddress = 'Required';
      if (!formData.suburb) newErrors.suburb = 'Required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
    const selectedAddress = addresses.find(a => a.id === formData.addressId);
    
    const quoteData = {
      vehicleId: formData.vehicleId || null,
      vehicle: selectedVehicle 
        ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
        : `${formData.vehicleYear} ${formData.vehicleMake} ${formData.vehicleModel}`,
      glassType: formData.glassType,
      serviceType: formData.serviceType,
      locationType: formData.locationType,
      addressId: formData.addressId || null,
      location: selectedAddress 
        ? `${selectedAddress.suburb}, ${selectedAddress.city}`
        : `${formData.suburb}, ${formData.city}`,
      notes: formData.notes
    };
    
    const quoteId = createQuote(quoteData);
    setLoading(false);
    onClose();
    navigate(`/dashboard/quotes/${quoteId}`);
  };
  
  const handleClose = () => {
    setFormData({
      vehicleId: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      glassType: '',
      serviceType: 'Replacement',
      locationType: 'Mobile',
      addressId: '',
      streetAddress: '',
      suburb: '',
      city: 'Johannesburg',
      notes: ''
    });
    setErrors({});
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request a Quote"
      description="Fill in your vehicle and service details to receive quotes from providers"
      size="lg"
    >
      <div className="space-y-6">
        {/* Vehicle Section */}
        <div>
          <h3 className="font-medium text-slate-900 mb-3">Vehicle Details</h3>
          
          {vehicles.length > 0 && (
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useExistingVehicle}
                  onChange={() => setUseExistingVehicle(true)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Use saved vehicle</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useExistingVehicle}
                  onChange={() => setUseExistingVehicle(false)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Enter new vehicle</span>
              </label>
            </div>
          )}
          
          {useExistingVehicle && vehicles.length > 0 ? (
            <Select
              label="Select Vehicle"
              options={vehicles.map(v => ({
                value: v.id,
                label: `${v.year} ${v.make} ${v.model}${v.registration ? ` (${v.registration})` : ''}`
              }))}
              value={formData.vehicleId}
              onChange={(e) => handleChange('vehicleId', e.target.value)}
              error={errors.vehicleId}
              required
            />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Make"
                options={vehicleMakes}
                value={formData.vehicleMake}
                onChange={(e) => handleChange('vehicleMake', e.target.value)}
                error={errors.vehicleMake}
                required
              />
              <Input
                label="Model"
                placeholder="e.g., Corolla"
                value={formData.vehicleModel}
                onChange={(e) => handleChange('vehicleModel', e.target.value)}
                error={errors.vehicleModel}
                required
              />
              <Select
                label="Year"
                options={yearOptions.map(y => ({ value: y, label: y }))}
                value={formData.vehicleYear}
                onChange={(e) => handleChange('vehicleYear', e.target.value)}
                error={errors.vehicleYear}
                required
              />
            </div>
          )}
        </div>
        
        {/* Service Details */}
        <div>
          <h3 className="font-medium text-slate-900 mb-3">Service Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Glass Type"
              options={glassTypes}
              value={formData.glassType}
              onChange={(e) => handleChange('glassType', e.target.value)}
              error={errors.glassType}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Service Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {serviceTypes.map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceType"
                      checked={formData.serviceType === type}
                      onChange={() => handleChange('serviceType', type)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-slate-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div>
          <h3 className="font-medium text-slate-900 mb-3">Service Location</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Location Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {locationTypes.map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locationType"
                    checked={formData.locationType === type}
                    onChange={() => handleChange('locationType', type)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-slate-700">
                    {type === 'Mobile' ? 'Mobile (come to me)' : 'Workshop (I\'ll go to provider)'}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          {addresses.length > 0 && (
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useExistingAddress}
                  onChange={() => setUseExistingAddress(true)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Use saved address</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useExistingAddress}
                  onChange={() => setUseExistingAddress(false)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Enter new address</span>
              </label>
            </div>
          )}
          
          {useExistingAddress && addresses.length > 0 ? (
            <Select
              label="Select Address"
              options={addresses.map(a => ({
                value: a.id,
                label: `${a.label}: ${a.street}, ${a.suburb}, ${a.city}`
              }))}
              value={formData.addressId}
              onChange={(e) => handleChange('addressId', e.target.value)}
              error={errors.addressId}
              required
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Street Address"
                placeholder="123 Main Road"
                value={formData.streetAddress}
                onChange={(e) => handleChange('streetAddress', e.target.value)}
                error={errors.streetAddress}
                className="sm:col-span-3"
                required
              />
              <Input
                label="Suburb/Area"
                placeholder="e.g., Sandton"
                value={formData.suburb}
                onChange={(e) => handleChange('suburb', e.target.value)}
                error={errors.suburb}
                required
              />
              <Select
                label="City"
                options={cities}
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
          )}
        </div>
        
        {/* Notes */}
        <Textarea
          label="Additional Notes (optional)"
          placeholder="Describe the damage, special requirements, or any other details..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>
      
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Submit Quote Request
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default NewQuoteModal;


