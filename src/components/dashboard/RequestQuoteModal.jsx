import { X, Upload, Trash2, Clock } from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import Button from "../ui/Button";
import { vehicleMakes, serviceTypes, timeSlots } from "../../data/quotes";
import vehicleService from "../../services/vehicleService";
import geocodingService from "../../services/geocodingService";
import publicSettingsService from "../../services/publicSettingsService";
import { useState, useRef, useEffect, useMemo } from "react";
import PremiumSelect from "../ui/PremiumSelect";
import PremiumDatePicker from "../ui/PremiumDatePicker";
import { getTodayString } from "../../utils/dateUtils";

const RequestQuoteModal = ({ isOpen, onClose }) => {
  const { createQuote, user, vehicles, addresses, quotes } =
    useDashboardStore();
  const fileInputRef = useRef(null);

  const hasActiveQuote = useMemo(() => {
    return quotes.some((q) => (q.status || "").toLowerCase() === "pending");
  }, [quotes]);

  const [formData, setFormData] = useState({
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: new Date().getFullYear().toString(),
    serviceType: "",
    glassType: "",
    city: "",
    postcode: "",
    addressLine1: "",
    coordinates: null,
    preferredDate: "",
    preferredTimeSlot: "",
    notes: "",
    images: [],
  });

  // Pre-fill logic
  useEffect(() => {
    if (isOpen && user && !formData.vehicleMake) {
      const defaultVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

      if (defaultVehicle || defaultAddress) {
        setFormData((prev) => ({
          ...prev,
          vehicleMake: defaultVehicle?.make || prev.vehicleMake,
          vehicleModel: defaultVehicle?.model || prev.vehicleModel,
          vehicleYear: defaultVehicle?.year?.toString() || prev.vehicleYear,
          city: defaultAddress?.city || prev.city,
          postcode: defaultAddress?.postcode || prev.postcode,
          addressLine1: defaultAddress?.line1 || prev.addressLine1,
          coordinates: defaultAddress?.coordinates || prev.coordinates,
        }));
      }
    }
  }, [isOpen, user, vehicles, addresses]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [availableMakes, setAvailableMakes] = useState(vehicleMakes); // Initialize with static list as fallback
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isFetchingMakes, setIsFetchingMakes] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [suggestedField, setSuggestedField] = useState(null);

  // Dynamic data from admin settings
  const [cities, setCities] = useState([]);
  const [glassTypes, setGlassTypes] = useState([]);
  const [adminServiceTypes, setAdminServiceTypes] = useState([]); // Store service types with pricing

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  // Fetch makes on mount
  useEffect(() => {
    const fetchMakes = async () => {
      setIsFetchingMakes(true);
      try {
        const makes = await vehicleService.getAllMakes();
        if (makes && makes.length > 0) {
          setAvailableMakes(makes);
        }
      } catch (err) {
        console.error("Failed to fetch makes", err);
      } finally {
        setIsFetchingMakes(false);
      }
    };
    fetchMakes();
  }, []);

  // Fetch public settings (cities, glass types, and service types with pricing)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await publicSettingsService.getPublicSettings();
        setCities(settings.serviceAreas || []);
        setGlassTypes(settings.glassTypes || []);
        // Store full service type objects with pricing
        setAdminServiceTypes(settings.serviceTypes || []);
      } catch (error) {
        console.error("Failed to fetch public settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    // If make changes, reset model and fetch new ones
    if (field === "vehicleMake") {
      setFormData((prev) => ({
        ...prev,
        vehicleModel: "",
        vehicleYear: new Date().getFullYear().toString(),
      }));
      setAvailableModels([]);
      setModelSearchQuery("");
    }

    // If service type changes, reset glass type
    if (field === "serviceType") {
      setFormData((prev) => ({ ...prev, glassType: "" }));
    }

    if (field === "vehicleModel") {
      setModelSearchQuery(value);
      setSuggestedField(null);
    }

    if (field === "preferredDate") {
      if (!formData.preferredTimeSlot) {
        setSuggestedField("preferredTimeSlot");
      }
    }

    if (field === "preferredTimeSlot") {
      setSuggestedField(null);
    }
  };

  // Fetch models dynamic based on selected make
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.vehicleMake) return;

      setIsFetchingModels(true);
      try {
        const models = await vehicleService.getModelsByMake(
          formData.vehicleMake
        );
        setAvailableModels(models);
      } catch (err) {
        console.error("Failed to fetch models", err);
      } finally {
        setIsFetchingModels(false);
      }
    };

    fetchModels();
  }, [formData.vehicleMake]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({
            ...prev,
            images: [
              ...prev.images,
              {
                id: Date.now() + Math.random(),
                data: reader.result,
                name: file.name,
              },
            ],
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.vehicleMake)
      newErrors.vehicleMake = "Vehicle make is required";
    if (!formData.vehicleModel)
      newErrors.vehicleModel = "Vehicle model is required";
    if (!formData.vehicleYear)
      newErrors.vehicleYear = "Vehicle year is required";
    if (!formData.serviceType)
      newErrors.serviceType = "Service type is required";
    if (!formData.glassType) newErrors.glassType = "Glass type is required";
    if (!formData.city) newErrors.city = "City is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filteredModels = availableModels
    .filter((model) =>
      model.toLowerCase().includes(modelSearchQuery.toLowerCase())
    )
    .slice(0, 50); // Limit to 50 for performance

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Geocode if coordinates are missing
      let finalCoordinates = formData.coordinates;
      if (!finalCoordinates && formData.city) {
        try {
          const fullAddress = `${formData.addressLine1 || ""}, ${
            formData.city
          }, ${formData.postcode || ""}, South Africa`
            .replace(/^, /, "")
            .replace(/, ,/g, ",");
          finalCoordinates = await geocodingService.getCoordinates(fullAddress);
        } catch (err) {
          console.error("Geocoding failed for quote", err);
        }
      }

      // Prepare API payload
      const quotePayload = {
        vehicle: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear) || new Date().getFullYear(),
        },
        serviceType: formData.serviceType.toLowerCase(),
        glassType: formData.glassType,
        serviceLocation: {
          type: "mobile",
          address: {
            addressLine1: formData.addressLine1,
            city: formData.city,
            postalCode: formData.postcode,
            coordinates: finalCoordinates,
          },
        },
        preferredDate: formData.preferredDate || null,
        preferredTimeSlot: (() => {
          const slot = formData.preferredTimeSlot?.toLowerCase() || "any";
          if (slot.includes("any")) return "any";
          return slot.replace(/\s*\(.*\)/, "").trim();
        })(),
        customerNotes: formData.notes,
        damageImages: formData.images.map((img) => img.data),
      };

      // Import quoteService
      const quoteService = (await import("../../services/quoteService"))
        .default;

      const response = await quoteService.createQuote(quotePayload);

      console.log("Quote created:", response);

      // Show success message
      const { addToast } = useDashboardStore.getState();
      addToast({
        type: "success",
        message:
          response?.message ||
          `Quote submitted! ${
            response?.data?.providersNotified || 0
          } providers notified.`,
      });

      // Reset form
      setFormData({
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: new Date().getFullYear().toString(),
        serviceType: "",
        glassType: "",
        city: "",
        postcode: "",
        addressLine1: "",
        coordinates: null,
        preferredDate: "",
        preferredTimeSlot: "",
        notes: "",
        images: [],
      });
      setModelSearchQuery("");

      // Close modal and pass the quote ID for navigation
      onClose(response?.data?._id || response?.data?.quoteNumber);
    } catch (error) {
      console.error("Error creating quote:", error);
      const { addToast } = useDashboardStore.getState();
      addToast({
        type: "error",
        message:
          error?.error || error?.message || "Failed to submit quote request",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity pointer-events-auto"
        onClick={() => onClose()}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-700/50 animate-in fade-in zoom-in duration-200 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Request a Quote
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in the details to get provider offers
            </p>
          </div>
          <button
            onClick={() => onClose()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Active Quote Alert */}
        {hasActiveQuote ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
              <Clock size={32} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Request In Progress
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                You already have an active quote request. Please wait for
                providers to respond or cancel your current request before
                creating a new one.
              </p>
            </div>
            <Button variant="secondary" onClick={() => onClose()}>
              Got it
            </Button>
          </div>
        ) : (
          <>
            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {/* Vehicle Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Vehicle Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <PremiumSelect
                    label="Make"
                    required
                    value={formData.vehicleMake}
                    options={availableMakes}
                    onChange={(val) => handleChange("vehicleMake", val)}
                    placeholder="Select make"
                    error={errors.vehicleMake}
                    searchable
                    loading={isFetchingMakes}
                  />

                  <PremiumSelect
                    label="Model"
                    required
                    value={formData.vehicleModel}
                    options={availableModels}
                    onChange={(val) => handleChange("vehicleModel", val)}
                    placeholder={
                      !formData.vehicleMake
                        ? "Select make first"
                        : "Search model"
                    }
                    error={errors.vehicleModel}
                    searchable
                    disabled={!formData.vehicleMake}
                    loading={isFetchingModels}
                    emptyMessage={
                      !formData.vehicleMake
                        ? "Please select a make first"
                        : "No models found"
                    }
                    autoOpen={suggestedField === "vehicleModel"}
                  />

                  <PremiumSelect
                    label="Year"
                    required
                    value={formData.vehicleYear}
                    options={years.map(String)}
                    onChange={(val) => handleChange("vehicleYear", val)}
                    placeholder="Select year"
                  />
                </div>
              </div>

              {/* Service Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Service Required
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PremiumSelect
                    label="Service Type"
                    required
                    value={formData.serviceType}
                    options={adminServiceTypes.map((st) => st.name)}
                    onChange={(val) => handleChange("serviceType", val)}
                    placeholder="Select type"
                    error={errors.serviceType}
                  />

                  <PremiumSelect
                    label="Glass Type"
                    required
                    value={formData.glassType}
                    options={(() => {
                      if (!formData.serviceType) return [];

                      // Find the selected service type object
                      const selectedService = adminServiceTypes.find(
                        (st) => st.name === formData.serviceType
                      );

                      if (!selectedService || !selectedService.pricing)
                        return [];

                      // Filter glass types that have pricing for selected service
                      const availableGlassTypes = glassTypes.filter(
                        (glassType) => {
                          const pricingEntry = selectedService.pricing.find(
                            (p) => p.glassType === glassType
                          );
                          return pricingEntry && pricingEntry.price > 0;
                        }
                      );

                      return availableGlassTypes;
                    })()}
                    onChange={(val) => handleChange("glassType", val)}
                    placeholder={
                      !formData.serviceType
                        ? "Select service first"
                        : "Select glass"
                    }
                    error={errors.glassType}
                    searchable
                    disabled={!formData.serviceType}
                    emptyMessage={
                      !formData.serviceType
                        ? "Please select a service type first"
                        : "No glass types available for this service"
                    }
                  />
                </div>
              </div>

              {/* Location Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Service Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PremiumSelect
                    label="City"
                    required
                    value={formData.city}
                    options={cities}
                    onChange={(val) => handleChange("city", val)}
                    placeholder="Select city"
                    error={errors.city}
                    searchable
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={formData.postcode}
                      onChange={(e) => handleChange("postcode", e.target.value)}
                      placeholder="e.g. 2196"
                      className="w-full px-3 py-[9.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200 shadow-sm"
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
                    onChange={(e) =>
                      handleChange("addressLine1", e.target.value)
                    }
                    placeholder="Street address for mobile service"
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Schedule Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Preferred Schedule (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PremiumDatePicker
                    label="Preferred Date"
                    value={formData.preferredDate}
                    onChange={(val) => handleChange("preferredDate", val)}
                    placeholder="Select a date"
                    minDate={getTodayString()}
                  />

                  <PremiumSelect
                    label="Preferred Time"
                    icon={Clock}
                    value={formData.preferredTimeSlot}
                    options={timeSlots}
                    onChange={(val) => handleChange("preferredTimeSlot", val)}
                    placeholder="Select time slot"
                    autoOpen={suggestedField === "preferredTimeSlot"}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Describe the damage or any special requirements..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none text-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Upload Photos (Optional)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Add photos of the damage to help providers give accurate
                  quotes
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
                    {formData.images.map((img) => (
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
          </>
        )}
      </div>
    </div>
  );
};

export default RequestQuoteModal;
