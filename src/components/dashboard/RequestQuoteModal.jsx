import { X, Upload, Trash2, Clock, Check } from "lucide-react";
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
import { CITIES } from "../../data/cities";

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
    serviceTypes: [],
    glassTypes: [],
    serviceSelections: [],
    city: "",
    postcode: "",
    addressLine1: "",
    coordinates: null,
    preferredDate: "",
    preferredTimeSlot: "",
    notes: "",
    images: [],
    otherMake: "",
    otherModel: "",
    suburb: "",
    hasAdasCamera: false,
    hasRainSensor: false,
  });

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

  // Pre-fill logic (Split into Vehicle and Address)
  useEffect(() => {
    if (isOpen && user && !formData.vehicleMake) {
      const defaultVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
      if (defaultVehicle) {
        setFormData((prev) => ({
          ...prev,
          vehicleMake: defaultVehicle.make || prev.vehicleMake,
          vehicleModel: defaultVehicle.model || prev.vehicleModel,
          vehicleYear: defaultVehicle.year?.toString() || prev.vehicleYear,
        }));
      }
    }
  }, [isOpen, user, vehicles]);

  useEffect(() => {
    // Only pre-fill address if modal is open, user exists, city isn't set,
    // and cities coverage data has been loaded from the backend
    if (isOpen && user && !formData.city && cities.length > 0) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddress) {
        // Verify if this city has active providers
        const cityInfo = cities.find((c) => c.value === defaultAddress.city);
        const isServiceable = cityInfo && !cityInfo.disabled;

        if (isServiceable) {
          setFormData((prev) => ({
            ...prev,
            city: defaultAddress.city || prev.city,
            suburb: defaultAddress.suburb || prev.suburb,
            postcode:
              defaultAddress.postcode ||
              defaultAddress.postalCode ||
              prev.postcode,
            addressLine1:
              defaultAddress.line1 ||
              defaultAddress.addressLine1 ||
              prev.addressLine1,
            coordinates: defaultAddress.coordinates || prev.coordinates,
          }));
        }
      }
    }
  }, [isOpen, user, addresses, cities, formData.city]);

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

        // Dynamic city coverage logic
        const supportedCities = settings.serviceAreas || [];
        const citiesWithProviders = settings.citiesWithProviders || [];
        const uniqueCityNames = Array.from(
          new Set([...CITIES, ...supportedCities]),
        ).sort();

        const transformedCities = uniqueCityNames.map((cityName) => {
          const hasProvider = citiesWithProviders.includes(cityName);
          return {
            value: cityName,
            label: cityName,
            subtitle: hasProvider ? null : "More providers coming soon",
            disabled: !hasProvider,
          };
        });

        setCities(transformedCities);
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
      const isOther = value === "Other";
      setFormData((prev) => ({
        ...prev,
        vehicleMake: value,
        vehicleModel: isOther ? "Other" : "",
        vehicleYear: new Date().getFullYear().toString(),
      }));
      setAvailableModels(isOther ? ["Other"] : []);
      setModelSearchQuery(isOther ? "Other" : "");
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

  const handleToggleService = (serviceName) => {
    setFormData((prev) => {
      const currentServices = prev.serviceTypes || [];
      const isSelected = currentServices.includes(serviceName);
      const newServices = isSelected
        ? currentServices.filter((s) => s !== serviceName)
        : [...currentServices, serviceName];

      // Sync serviceSelections
      let newServiceSelections = [...(prev.serviceSelections || [])];
      if (isSelected) {
        newServiceSelections = newServiceSelections.filter(
          (s) => s.serviceName !== serviceName,
        );
      } else {
        const matchingDef = adminServiceTypes.find(
          (st) => st.name === serviceName,
        );
        const stType =
          matchingDef?.id ||
          (serviceName.toLowerCase().includes("repair")
            ? "repair"
            : serviceName.toLowerCase().includes("replacement")
              ? "replacement"
              : "tinting");

        newServiceSelections.push({
          serviceName,
          serviceType: stType,
          glassTypes: [],
        });
      }

      // Filter glass types to only keep those valid for the new set of services
      const validGlassTypes = new Set();
      adminServiceTypes.forEach((st) => {
        if (newServices.includes(st.name)) {
          st.pricing?.forEach((p) => {
            if (p.price > 0) validGlassTypes.add(p.glassType);
          });
        }
      });

      const newGlassTypes = (prev.glassTypes || []).filter((g) =>
        validGlassTypes.has(g),
      );

      return {
        ...prev,
        serviceTypes: newServices,
        glassTypes: newGlassTypes, // Remove invalid ones
        serviceSelections: newServiceSelections,
      };
    });

    if (errors.serviceType)
      setErrors((prev) => ({ ...prev, serviceType: null }));
    if (errors.glassType) setErrors((prev) => ({ ...prev, glassType: null }));
  };

  const handleToggleGlassForService = (serviceName, glassName) => {
    setFormData((prev) => {
      const newServiceSelections = prev.serviceSelections.map((s) => {
        if (s.serviceName === serviceName) {
          const currentGlass = s.glassTypes || [];
          const isSelected = currentGlass.includes(glassName);
          const newGlassList = isSelected
            ? currentGlass.filter((g) => g !== glassName)
            : [...currentGlass, glassName];
          return { ...s, glassTypes: newGlassList };
        }
        return s;
      });

      // Update global glassTypes for backward compatibility (union of all)
      const allSelectedGlass = new Set();
      newServiceSelections.forEach((s) => {
        s.glassTypes.forEach((g) => allSelectedGlass.add(g));
      });

      return {
        ...prev,
        serviceSelections: newServiceSelections,
        glassTypes: Array.from(allSelectedGlass).sort(),
      };
    });

    if (errors.glassType) setErrors((prev) => ({ ...prev, glassType: null }));
  };

  // Fetch models dynamic based on selected make
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.vehicleMake || formData.vehicleMake === "Other") return;

      setIsFetchingModels(true);
      try {
        const models = await vehicleService.getModelsByMake(
          formData.vehicleMake,
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
    if (!formData.serviceTypes || formData.serviceTypes.length === 0)
      newErrors.serviceType = "Service type is required";
    if (!formData.glassTypes || formData.glassTypes.length === 0)
      newErrors.glassType = "Glass type is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.images || formData.images.length === 0)
      newErrors.images = "At least one photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filteredModels = availableModels
    .filter((model) =>
      model.toLowerCase().includes(modelSearchQuery.toLowerCase()),
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
          make:
            formData.vehicleMake === "Other"
              ? formData.otherMake
              : formData.vehicleMake,
          model:
            formData.vehicleModel === "Other"
              ? formData.otherModel
              : formData.vehicleModel,
          year: parseInt(formData.vehicleYear) || new Date().getFullYear(),
          hasAdasCamera: formData.hasAdasCamera,
          hasRainSensor: formData.hasRainSensor,
        },
        serviceTypes: (() => {
          const mappedServices = new Set();
          formData.serviceTypes.forEach((service) => {
            const st = service.toLowerCase();
            if (st.includes("replacement")) mappedServices.add("replacement");
            else if (st.includes("repair")) mappedServices.add("repair");
            else if (st.includes("smash") || st.includes("tint"))
              mappedServices.add("tinting");
            else mappedServices.add("other");
          });
          return Array.from(mappedServices);
        })(),
        glassTypes: formData.glassTypes.map((g) =>
          g.toLowerCase().trim().replace(/\s+/g, "-").replace(/[()]/g, ""),
        ),
        serviceSelections: formData.serviceSelections,
        serviceLocation: {
          type: "mobile",
          address: {
            addressLine1: formData.addressLine1,
            suburb: formData.suburb,
            city: formData.city,
            postalCode: formData.postcode,
            coordinates: finalCoordinates,
          },
        },
        preferredDate: formData.preferredDate || null,
        preferredTimeSlot: formData.preferredTimeSlot || "Any time",
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
        serviceTypes: [],
        glassTypes: [],
        serviceSelections: [],
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

                {(formData.vehicleMake === "Other" ||
                  formData.vehicleModel === "Other") && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {formData.vehicleMake === "Other" ? (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          Specify Make <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.otherMake}
                          onChange={(e) =>
                            handleChange("otherMake", e.target.value)
                          }
                          placeholder="Enter vehicle make"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                    ) : (
                      <div />
                    )}

                    {formData.vehicleModel === "Other" ? (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          Specify Model <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.otherModel}
                          onChange={(e) =>
                            handleChange("otherModel", e.target.value)
                          }
                          placeholder="Enter vehicle model"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                )}
              </div>

              {/* Service Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Service Required
                </h3>
                <div className="space-y-4">
                  {/* Service Type - FIRST */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 mt-4">
                      Service Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adminServiceTypes.map((st) => {
                        const isSelected = formData.serviceTypes?.includes(
                          st.name,
                        );
                        return (
                          <button
                            key={st.name}
                            type="button"
                            onClick={() => handleToggleService(st.name)}
                            className={`relative p-4 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:border-primary-600"
                                : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-4 h-4 bg-primary-600 text-white rounded-full flex items-center justify-center">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                            <div className="font-semibold text-sm text-slate-900 dark:text-white pr-6">
                              {st.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.serviceType && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.serviceType}
                      </p>
                    )}
                  </div>

                  {/* Glass Type - SECOND (filtered by service) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 mt-4 flex items-center gap-1.5">
                      Select Glass for Each Service{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {!formData.serviceSelections ||
                    formData.serviceSelections.length === 0 ? (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          ℹ️ Please select a service type above first
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.serviceSelections.map((selection) => {
                          const serviceDef = adminServiceTypes.find(
                            (s) => s.name === selection.serviceName,
                          );
                          const validGlassForThisService =
                            serviceDef?.pricing
                              ?.filter((p) => p.price > 0)
                              .map((p) => p.glassType)
                              .sort() || [];

                          return (
                            <div
                              key={selection.serviceName}
                              className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                                  {selection.serviceName}
                                </h4>
                              </div>

                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {validGlassForThisService.map((glassName) => {
                                  const isSelected =
                                    selection.glassTypes.includes(glassName);
                                  return (
                                    <button
                                      key={glassName}
                                      type="button"
                                      onClick={() =>
                                        handleToggleGlassForService(
                                          selection.serviceName,
                                          glassName,
                                        )
                                      }
                                      className={`relative p-3 rounded-xl border text-[11px] font-medium transition-all text-left ${
                                        isSelected
                                          ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:border-primary-600 dark:text-primary-300"
                                          : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:border-primary-300"
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-primary-600 text-white rounded-full flex items-center justify-center">
                                          <Check size={8} strokeWidth={3} />
                                        </div>
                                      )}
                                      <span
                                        className={`block ${isSelected ? "pr-4" : ""}`}
                                      >
                                        {glassName}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {errors.glassType && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.glassType}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vehicle Features - Only for Windscreen */}
                {formData.glassTypes.includes("Windscreen") && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Vehicle Features
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleChange("hasAdasCamera", !formData.hasAdasCamera)
                        }
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          formData.hasAdasCamera
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500"
                            : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            formData.hasAdasCamera
                              ? "bg-primary-500 border-primary-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {formData.hasAdasCamera && <Check size={12} />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            ADAS Camera
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Advanced Driver Assistance System
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleChange("hasRainSensor", !formData.hasRainSensor)
                        }
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          formData.hasRainSensor
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500"
                            : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            formData.hasRainSensor
                              ? "bg-primary-500 border-primary-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {formData.hasRainSensor && <Check size={12} />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            Rain / Light Sensor
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Automatic wipers and lights
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Service Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <PremiumSelect
                    label="City"
                    required
                    value={formData.city}
                    options={cities}
                    onChange={(val) => handleChange("city", val)}
                    placeholder="Select city"
                    error={errors.city}
                    isSearchable
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Suburb (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.suburb}
                      onChange={(e) => handleChange("suburb", e.target.value)}
                      placeholder="e.g. Sandton"
                      className="w-full px-3 py-[9.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200 shadow-sm"
                    />
                  </div>

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

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Upload Photos <span className="text-red-500">*</span>
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
                {errors.images && (
                  <p className="text-sm text-red-500 mt-2">{errors.images}</p>
                )}
              </div>

              {/* Notes - Moved after images */}
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
