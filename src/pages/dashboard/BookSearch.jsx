import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Car,
  MapPin,
  Wrench,
  Shield,
  Star,
  Clock,
  ChevronRight,
  Check,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import Button from "../../components/ui/Button";
import vehicleService from "../../services/vehicleService";
import profileService from "../../services/profileService";
import publicSettingsService from "../../services/publicSettingsService";
import { CITIES } from "../../data/cities";
import PremiumSelect from "../../components/ui/PremiumSelect";

const BookSearch = () => {
  const navigate = useNavigate();
  const {
    setSearchCriteria,
    searchCriteria,
    user,
    vehicles,
    addresses,
    setVehicles,
    setAddresses,
  } = useDashboardStore();

  const [selectedSavedVehicle, setSelectedSavedVehicle] = useState("");
  const [checkingActive, setCheckingActive] = useState(true);

  const [formData, setFormData] = useState({
    vehicleMake: searchCriteria?.vehicleMake || "",
    vehicleModel: searchCriteria?.vehicleModel || "",
    vehicleYear:
      searchCriteria?.vehicleYear || new Date().getFullYear().toString(),
    glassTypes:
      searchCriteria?.glassTypes ||
      (searchCriteria?.glassType ? [searchCriteria.glassType] : []),
    serviceTypes:
      searchCriteria?.serviceTypes ||
      (searchCriteria?.serviceType ? [searchCriteria.serviceType] : []),
    serviceSelections: searchCriteria?.serviceSelections || [],
    city: searchCriteria?.city || "",
    postcode: searchCriteria?.postcode || "",
  });

  // Fetch saved data if missing from store
  useEffect(() => {
    const fetchSavedData = async () => {
      if (vehicles.length === 0) {
        try {
          const res = await profileService.getVehicles();
          if (res.success && res.data) {
            const mappedVehicles = res.data.map((v) => ({
              ...v,
              id: v._id,
              make: v.make,
              model: v.model,
              year: v.year,
              isDefault: v.isDefault,
            }));
            setVehicles(mappedVehicles);
          }
        } catch (error) {}
      }

      if (addresses.length === 0) {
        try {
          const res = await profileService.getAddresses();
          if (res.success && res.data) {
            const mappedAddresses = res.data.map((a) => ({
              ...a,
              id: a._id,
              label: a.label,
              line1: a.addressLine1,
              suburb: a.suburb,
              city: a.city,
              postcode: a.postalCode,
              isDefault: a.isDefault,
              coordinates: a.coordinates,
            }));
            setAddresses(mappedAddresses);
          }
        } catch (error) {}
      }
    };
    fetchSavedData();
  }, []);

  // Check for active searching or pending payment bookings to redirect user
  useEffect(() => {
    const checkActiveBookings = async () => {
      try {
        setCheckingActive(true);
        const res = await bookingService.getBookings();
        if (res.success && res.data && res.data.length > 0) {
          // Check for searching status
          const searching = res.data.find((b) => b.status === "searching");
          if (searching) {
            navigate(
              `/dashboard/booking/searching/${searching._id || searching.id}`,
            );
            return;
          }

          // Check for accepted/awaiting-payment status
          const pending = res.data.find(
            (b) => b.status === "accepted" || b.status === "awaiting-payment",
          );
          if (pending) {
            navigate(`/dashboard/booking/pending/${pending._id || pending.id}`);
            return;
          }
        }
      } catch (err) {
      } finally {
        setCheckingActive(false);
      }
    };

    checkActiveBookings();
  }, [navigate]);

  // Handle saved vehicle selection logic
  const handleSavedVehicleChange = (vehicleId) => {
    const v = vehicles.find((veh) => veh.id === vehicleId);
    if (v) {
      setSelectedSavedVehicle(vehicleId);
      setFormData((prev) => ({
        ...prev,
        vehicleMake: v.make,
        vehicleModel: v.model,
        vehicleYear: v.year.toString(),
      }));
      setAvailableModels([]);
    }
  };

  // Pre-fill from saved details ONLY IF form is empty (not pre-filled from searchCriteria)
  useEffect(() => {
    if (checkingActive) return;

    const isFormEmpty =
      !formData.vehicleMake && formData.glassTypes?.length === 0;

    // If we have vehicles and form is empty, pick default
    if (isFormEmpty && vehicles.length > 0 && !selectedSavedVehicle) {
      const defaultVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
      handleSavedVehicleChange(defaultVehicle.id);
    }

    // Address defaults
    if (isFormEmpty && addresses.length > 0 && !formData.city) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      setFormData((prev) => ({
        ...prev,
        city: defaultAddress.city,
        postcode: defaultAddress.postcode || "",
      }));
    }
  }, [vehicles, addresses, checkingActive]);

  const [errors, setErrors] = useState({});
  const [availableModels, setAvailableModels] = useState([]);
  const [availableMakes, setAvailableMakes] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isFetchingMakes, setIsFetchingMakes] = useState(false);
  const [suggestedField, setSuggestedField] = useState(null);

  // Dynamic data from admin settings
  const [cities, setCities] = useState(CITIES);
  const [glassTypes, setGlassTypes] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // Fetch makes on mount
  useEffect(() => {
    const fetchMakes = async () => {
      setIsFetchingMakes(true);
      try {
        const makes = await vehicleService.getAllMakes();
        if (makes && makes.length > 0) setAvailableMakes(makes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingMakes(false);
      }
    };
    fetchMakes();
  }, []);

  // Fetch dynamic settings from admin
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await publicSettingsService.getPublicSettings();
        // Use CITIES constant instead of serviceAreas for full SA list
        setCities(CITIES);
        setGlassTypes(settings.glassTypes || []);

        let fetchedServices = settings.serviceTypes || [];

        // HACK: Ensure "Glass Repair" has all glass types even if DB is stale
        const replacementService = fetchedServices.find(
          (s) =>
            s.id === "replacement" ||
            s.name === "Glass Replacement" ||
            (s.name || "").toLowerCase().includes("replacement"),
        );

        const repairServiceIndex = fetchedServices.findIndex(
          (s) =>
            s.id === "repair" ||
            s.name === "Glass Repair" ||
            (s.name || "").toLowerCase().includes("repair"),
        );

        if (replacementService && repairServiceIndex !== -1) {
          const repairService = fetchedServices[repairServiceIndex];
          // Get all glass types from replacement
          const targetGlassTypes =
            replacementService.pricing?.map((p) => p.glassType) || [];

          // Create new pricing array for repair, maintaining existing or defaulting
          const currentRepairPricing = repairService.pricing || [];
          const newRepairPricing = [...currentRepairPricing];

          targetGlassTypes.forEach((glass) => {
            if (!newRepairPricing.find((p) => p.glassType === glass)) {
              newRepairPricing.push({
                glassType: glass,
                price: 450, // Default repair price
              });
            }
          });

          // Update the repair service object
          fetchedServices[repairServiceIndex] = {
            ...repairService,
            pricing: newRepairPricing,
          };
        }

        setServiceTypes(fetchedServices);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        // Fallback defaults
        setCities(CITIES);
        setGlassTypes([
          "Windscreen",
          "Side Window (Front Left)",
          "Side Window (Front Right)",
          "Side Window (Rear Left)",
          "Side Window (Rear Right)",
          "Rear Window",
          "Door Glass",
          "Quarter Glass",
          "Sunroof",
        ]);
        setServiceTypes([
          {
            name: "Glass Replacement",
            description: "Full glass replacement",
            pricing: [
              { glassType: "Windscreen", price: 1850 },
              { glassType: "Side Window (Front Left)", price: 950 },
              { glassType: "Side Window (Front Right)", price: 950 },
              { glassType: "Side Window (Rear Left)", price: 850 },
              { glassType: "Side Window (Rear Right)", price: 850 },
              { glassType: "Rear Window", price: 1450 },
              { glassType: "Door Glass", price: 850 },
              { glassType: "Quarter Glass", price: 650 },
              { glassType: "Sunroof", price: 2200 },
            ],
          },
          {
            name: "Glass Repair",
            description: "Chip and crack repair",
            pricing: [
              { glassType: "Windscreen", price: 450 },
              { glassType: "Side Window (Front Left)", price: 450 },
              { glassType: "Side Window (Front Right)", price: 450 },
              { glassType: "Side Window (Rear Left)", price: 450 },
              { glassType: "Side Window (Rear Right)", price: 450 },
              { glassType: "Rear Window", price: 450 },
              { glassType: "Door Glass", price: 450 },
              { glassType: "Quarter Glass", price: 450 },
              { glassType: "Sunroof", price: 450 },
            ],
          },
          {
            name: "Anti-Smash and Grab Film",
            description: "Anti-Smash and Grab Film application",
            pricing: [
              { glassType: "Windscreen", price: 800 },
              { glassType: "Side Window (Front Left)", price: 400 },
              { glassType: "Side Window (Front Right)", price: 400 },
              { glassType: "Side Window (Rear Left)", price: 400 },
              { glassType: "Side Window (Rear Right)", price: 400 },
              { glassType: "Rear Window", price: 600 },
              { glassType: "Full Car Package", price: 2500 },
            ],
          },
        ]);
      }
    };
    fetchSettings();
  }, []);

  // Normalize form data against loaded options and rebuild serviceSelections
  useEffect(() => {
    if (serviceTypes.length === 0 || glassTypes.length === 0) return;

    let hasChanges = false;
    let newServices = formData.serviceTypes || [];
    let newGlass = formData.glassTypes || [];
    let newServiceSelections = [...(formData.serviceSelections || [])];

    // Normalize Service Types
    if (newServices.length > 0) {
      const normalized = newServices.map((service) => {
        const exactMatch = serviceTypes.find((st) => st.name === service);
        if (exactMatch) return service;

        const match = serviceTypes.find(
          (st) =>
            st.name.toLowerCase().includes(service.toLowerCase()) ||
            (service.toLowerCase() === "replacement" &&
              st.name === "Glass Replacement") ||
            (service.toLowerCase() === "repair" &&
              st.name === "Glass Repair") ||
            (service.toLowerCase() === "tinting" &&
              st.name === "Anti-Smash and Grab Film"),
        );
        return match ? match.name : service;
      });
      if (JSON.stringify(normalized) !== JSON.stringify(newServices)) {
        newServices = normalized;
        hasChanges = true;
      }
    }

    // Normalize Glass Types
    if (newGlass.length > 0) {
      const normalized = newGlass.map((glass) => {
        const match = glassTypes.find(
          (gt) => gt.toLowerCase() === glass.toLowerCase(),
        );
        return match || glass;
      });
      if (JSON.stringify(normalized) !== JSON.stringify(newGlass)) {
        newGlass = normalized;
        hasChanges = true;
      }
    }

    // Synchronize serviceSelections
    const currentNames = newServiceSelections.map((s) => s.serviceName);
    const missing = newServices.filter((s) => !currentNames.includes(s));
    const extra = currentNames.filter((s) => !newServices.includes(s));

    if (missing.length > 0 || extra.length > 0) {
      hasChanges = true;
      newServiceSelections = newServiceSelections.filter((s) =>
        newServices.includes(s.serviceName),
      );

      missing.forEach((serviceName) => {
        const stType = serviceName.toLowerCase().includes("repair")
          ? "repair"
          : serviceName.toLowerCase().includes("replacement")
            ? "replacement"
            : serviceName.toLowerCase().includes("tint")
              ? "tinting"
              : "other";

        const def = serviceTypes.find((st) => st.name === serviceName);
        const validGlass =
          def?.pricing?.filter((p) => p.price > 0).map((p) => p.glassType) ||
          [];
        const matchingGlass = newGlass.filter((g) => validGlass.includes(g));

        newServiceSelections.push({
          serviceName,
          serviceType: stType,
          glassTypes: matchingGlass,
        });
      });
    }

    if (hasChanges) {
      setFormData((prev) => ({
        ...prev,
        serviceTypes: newServices,
        glassTypes: newGlass,
        serviceSelections: newServiceSelections,
      }));
    }
  }, [
    serviceTypes,
    glassTypes,
    formData.serviceTypes,
    formData.glassTypes,
    formData.serviceSelections,
  ]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    if (field === "vehicleMake") {
      setFormData((prev) => ({
        ...prev,
        vehicleMake: value,
        vehicleModel: "",
      }));
      setAvailableModels([]);
      setSuggestedField("vehicleModel");
      setSelectedSavedVehicle(""); // Clear saved vehicle selection on manual change
    }

    if (field === "vehicleModel") {
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
        const matchingDef = serviceTypes.find((st) => st.name === serviceName);
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
      serviceTypes.forEach((st) => {
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

  const handleToggleGlass = (glassName) => {
    setFormData((prev) => {
      const currentGlass = prev.glassTypes || [];
      const isSelected = currentGlass.includes(glassName);
      const newGlass = isSelected
        ? currentGlass.filter((g) => g !== glassName)
        : [...currentGlass, glassName];

      return { ...prev, glassTypes: newGlass };
    });

    if (errors.glassType) setErrors((prev) => ({ ...prev, glassType: null }));
  };

  // Fetch models dynamically
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.vehicleMake) return;

      setIsFetchingModels(true);
      try {
        const models = await vehicleService.getModelsByMake(
          formData.vehicleMake,
        );
        setAvailableModels(models);
      } catch (err) {
      } finally {
        setIsFetchingModels(false);
      }
    };

    fetchModels();
  }, [formData.vehicleMake]);

  const validate = () => {
    const newErrors = {};
    if (!formData.vehicleMake)
      newErrors.vehicleMake = "Vehicle make is required";
    if (!formData.vehicleModel) newErrors.vehicleModel = "Model is required";
    if (!formData.serviceTypes || formData.serviceTypes.length === 0)
      newErrors.serviceType = "Service type is required";
    if (!formData.glassTypes || formData.glassTypes.length === 0)
      newErrors.glassType = "Glass type is required";
    if (!formData.city) newErrors.city = "City is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSearchCriteria(formData);
    navigate("/dashboard/book/request");
  };

  if (checkingActive) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-10" />
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

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
          Compare instant prices and book trusted service providers in your
          area.
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

            {vehicles.length > 0 && (
              <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <PremiumSelect
                  label="Select from Saved Vehicles"
                  value={selectedSavedVehicle}
                  options={vehicles.map((v) => ({
                    value: v.id,
                    label: `${v.year} ${v.make} ${v.model} ${
                      v.registrationNumber ? `(${v.registrationNumber})` : ""
                    }`,
                  }))}
                  onChange={handleSavedVehicleChange}
                  placeholder="Choose saved vehicle"
                  icon={Car}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  !formData.vehicleMake ? "Select make first" : "Search model"
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
                value={formData.vehicleYear}
                options={years.map(String)}
                onChange={(val) => handleChange("vehicleYear", val)}
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
            <div className="space-y-4">
              {/* Service Type - FIRST */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Service Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceTypes.map((serviceType) => {
                    const isSelected = formData.serviceTypes?.includes(
                      serviceType.name,
                    );
                    return (
                      <button
                        key={serviceType.name}
                        type="button"
                        onClick={() => handleToggleService(serviceType.name)}
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
                          {serviceType.name}
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
                      const serviceDef = serviceTypes.find(
                        (st) => st.name === selection.serviceName,
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
                            <div className="w-6 h-6 rounded-md bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                              <Wrench size={14} />
                            </div>
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                              {selection.serviceName}
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                                    <div className="absolute top-1 right-1 w-3 h-3 bg-primary-600 text-white rounded-full flex items-center justify-center">
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
                onChange={(val) => handleChange("city", val)}
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
                  onChange={(e) => handleChange("postcode", e.target.value)}
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
              Your request will be broadcast to all professional providers
              within a 50km radius.
            </p>
          </div>
        </form>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star
              size={24}
              className="text-primary-600 dark:text-primary-400"
            />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Verified Providers
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            All providers are vetted and rated by real customers
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield
              size={24}
              className="text-success-600 dark:text-success-400"
            />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Quality Guaranteed
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Warranty-backed workmanship on all services
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
          <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock
              size={24}
              className="text-warning-600 dark:text-warning-400"
            />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Same-Day Service
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Many providers offer same-day appointments
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookSearch;
