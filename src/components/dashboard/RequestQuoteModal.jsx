import {
  X,
  Upload,
  Trash2,
  Check,
  Car,
  Wrench,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Shield,
  Clock,
  Users,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import vehicleService from "../../services/vehicleService";
import geocodingService from "../../services/geocodingService";
import publicSettingsService from "../../services/publicSettingsService";
import { useState, useEffect } from "react";
import PremiumSelect from "../ui/PremiumSelect";
import ImageUploadSlot from "../ui/ImageUploadSlot";
import { BsCarFrontFill } from "react-icons/bs";
import { HiIdentification } from "react-icons/hi2";
import { MdPhotoCamera } from "react-icons/md";

import { CITIES } from "../../data/cities";

const TOTAL_STEPS = 3;

const RequestQuoteModal = ({ isOpen, onClose, prefillVehicle = null }) => {
  const { createQuote, user, vehicles, addresses, quotes } =
    useDashboardStore();

  const [currentStep, setCurrentStep] = useState(1);

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
    preferredDate: null,
    preferredTimeSlot: null,
    notes: "",
    vehicleImages: {
      frontView: null,
      vinLicenceDisc: null,
      damagePhotos: [],
    },
    suburb: "",
    hasAdasCamera: false,
    hasRainSensor: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [availableMakes, setAvailableMakes] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isFetchingMakes, setIsFetchingMakes] = useState(false);
  const [makeLookup, setMakeLookup] = useState({});
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [suggestedField, setSuggestedField] = useState(null);

  // Dynamic data from admin settings
  const [cities, setCities] = useState([]);
  const [glassTypes, setGlassTypes] = useState([]);
  const [adminServiceTypes, setAdminServiceTypes] = useState([]);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
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
        preferredDate: null,
        preferredTimeSlot: null,
        notes: "",
        vehicleImages: {
          frontView: null,
          vinLicenceDisc: null,
          damagePhotos: [],
        },
        suburb: "",
        hasAdasCamera: false,
        hasRainSensor: false,
      });
      setErrors({});
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Pre-fill Logic
  useEffect(() => {
    if (isOpen && !formData.vehicleMake) {
      const targetVehicle =
        prefillVehicle ||
        (vehicles.length > 0
          ? vehicles.find((v) => v.isDefault) || vehicles[0]
          : null);
      if (targetVehicle) {
        setFormData((prev) => ({
          ...prev,
          vehicleMake: targetVehicle.make || prev.vehicleMake,
          vehicleModel: targetVehicle.model || prev.vehicleModel,
          vehicleYear: targetVehicle.year?.toString() || prev.vehicleYear,
          hasAdasCamera: targetVehicle.hasAdasCamera || prev.hasAdasCamera,
          hasRainSensor: targetVehicle.hasRainSensor || prev.hasRainSensor,
        }));
      }
    }
  }, [isOpen, user, vehicles, prefillVehicle, formData.vehicleMake]);

  useEffect(() => {
    if (
      isOpen &&
      user &&
      addresses.length > 0 &&
      !formData.city &&
      cities.length > 0
    ) {
      const defaultAddress =
        addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddress) {
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
          const lookup = {};
          const names = makes.map((m) => {
            lookup[m.name] = m._id;
            return m.name;
          });
          setAvailableMakes(names);
          setMakeLookup(lookup);
        }
      } catch (err) {
        console.error("Failed to fetch makes", err);
      } finally {
        setIsFetchingMakes(false);
      }
    };
    fetchMakes();
  }, []);

  // Fetch public settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await publicSettingsService.getPublicSettings();

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

    if (field === "vehicleMake") {
      setFormData((prev) => ({
        ...prev,
        vehicleMake: value,
        vehicleModel: "",
        vehicleYear: new Date().getFullYear().toString(),
      }));
      setAvailableModels([]);
      setModelSearchQuery("");

      if (value && !availableMakes.includes(value)) {
        vehicleService
          .createMake(value)
          .then((make) => {
            if (make) {
              setAvailableMakes((prev) =>
                [...new Set([...prev, make.name])].sort(),
              );
              setMakeLookup((prev) => ({ ...prev, [make.name]: make._id }));
            }
          })
          .catch(() => {});
      }
    }

    if (field === "vehicleModel") {
      setModelSearchQuery(value);
      setSuggestedField(null);

      if (value && !availableModels.includes(value)) {
        const makeIdOrName =
          makeLookup[formData.vehicleMake] || formData.vehicleMake;
        if (makeIdOrName) {
          vehicleService
            .createModel(makeIdOrName, value)
            .then((model) => {
              if (model) {
                setAvailableModels((prev) =>
                  [...new Set([...prev, model.name])].sort(),
                );
              }
            })
            .catch(() => {});
        }
      }
    }
  };

  const handleToggleService = (serviceName) => {
    setFormData((prev) => {
      const currentServices = prev.serviceTypes || [];
      const isSelected = currentServices.includes(serviceName);
      const newServices = isSelected
        ? currentServices.filter((s) => s !== serviceName)
        : [...currentServices, serviceName];

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
        glassTypes: newGlassTypes,
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

  // Fetch models based on selected make
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.vehicleMake) return;

      setIsFetchingModels(true);
      try {
        const makeIdOrName =
          makeLookup[formData.vehicleMake] || formData.vehicleMake;
        const models = await vehicleService.getModelsByMake(makeIdOrName);
        setAvailableModels(models.map((m) => m.name));
      } catch (err) {
        console.error("Failed to fetch models", err);
      } finally {
        setIsFetchingModels(false);
      }
    };

    fetchModels();
  }, [formData.vehicleMake]);

  const handleSingleImageUpload = (category, imageObj) => {
    setFormData((prev) => ({
      ...prev,
      vehicleImages: { ...prev.vehicleImages, [category]: imageObj },
    }));
    if (errors[category]) setErrors((prev) => ({ ...prev, [category]: null }));
  };

  const removeSingleImage = (category) => {
    setFormData((prev) => ({
      ...prev,
      vehicleImages: { ...prev.vehicleImages, [category]: null },
    }));
  };

  const handleDamagePhotoUpload = (imageObj) => {
    setFormData((prev) => ({
      ...prev,
      vehicleImages: {
        ...prev.vehicleImages,
        damagePhotos: [...prev.vehicleImages.damagePhotos, imageObj],
      },
    }));
    if (errors.damagePhotos) setErrors((prev) => ({ ...prev, damagePhotos: null }));
  };

  const removeDamagePhoto = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      vehicleImages: {
        ...prev.vehicleImages,
        damagePhotos: prev.vehicleImages.damagePhotos.filter((img) => img.id !== imageId),
      },
    }));
  };

  // Per-step validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.vehicleMake)
        newErrors.vehicleMake = "Vehicle make is required";
      if (!formData.vehicleModel)
        newErrors.vehicleModel = "Vehicle model is required";
      if (!formData.vehicleYear)
        newErrors.vehicleYear = "Vehicle year is required";
    }

    if (step === 2) {
      if (!formData.serviceTypes || formData.serviceTypes.length === 0)
        newErrors.serviceType = "Service type is required";
      if (!formData.glassTypes || formData.glassTypes.length === 0)
        newErrors.glassType = "Glass type is required";
      if (!formData.vehicleImages.frontView) newErrors.frontView = "Front of vehicle photo is required";
      if (!formData.vehicleImages.vinLicenceDisc) newErrors.vinLicenceDisc = "VIN / Licence disc photo is required";
      if (!formData.vehicleImages.damagePhotos.length) newErrors.damagePhotos = "At least one damage photo is required";
    }

    if (step === 3) {
      if (!formData.city) newErrors.city = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (!formData.vehicleImages.frontView) newErrors.frontView = "Front of vehicle photo is required";
    if (!formData.vehicleImages.vinLicenceDisc) newErrors.vinLicenceDisc = "VIN / Licence disc photo is required";
    if (!formData.vehicleImages.damagePhotos.length) newErrors.damagePhotos = "At least one damage photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validate()) {
      // Go to step with errors
      if (errors.vehicleMake || errors.vehicleModel || errors.vehicleYear) {
        setCurrentStep(1);
      } else if (
        errors.serviceType ||
        errors.glassType ||
        errors.frontView ||
        errors.vinLicenceDisc ||
        errors.damagePhotos
      ) {
        setCurrentStep(2);
      } else if (errors.city) {
        setCurrentStep(3);
      }
      return;
    }

    setIsSubmitting(true);

    try {
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

      // Find matching saved vehicle to get registrationNumber
      const matchedVehicle = vehicles.find(
        (v) =>
          v.make === formData.vehicleMake &&
          v.model === formData.vehicleModel &&
          v.year?.toString() === formData.vehicleYear,
      );

      const quotePayload = {
        vehicle: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear) || new Date().getFullYear(),
          hasAdasCamera: formData.hasAdasCamera,
          hasRainSensor: formData.hasRainSensor,
          ...(matchedVehicle?.registrationNumber && {
            registrationNumber: matchedVehicle.registrationNumber,
          }),
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
        glassTypes: formData.glassTypes.map((g) => {
          const lower = g.toLowerCase().trim();
          if (lower === "windscreen") return "windscreen";
          if (lower.includes("front left") || lower.includes("front-left")) return "front-side-left";
          if (lower.includes("front right") || lower.includes("front-right")) return "front-side-right";
          if (lower.includes("rear left") || lower.includes("rear-left")) return "rear-side-left";
          if (lower.includes("rear right") || lower.includes("rear-right")) return "rear-side-right";
          if (lower.includes("rear window") || lower === "rear-window") return "rear-window";
          if (lower.includes("quarter")) return "quarter-glass";
          if (lower.includes("sunroof")) return "sunroof";
          if (lower.includes("full car") || lower.includes("all")) return "all";
          return lower.replace(/\s+/g, "-").replace(/[()]/g, "");
        }),
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
        preferredDate: null,
        preferredTimeSlot: null,
        customerNotes: formData.notes,
        damageImages: [
          formData.vehicleImages.frontView?.data,
          formData.vehicleImages.vinLicenceDisc?.data,
          ...formData.vehicleImages.damagePhotos.map((img) => img.data),
        ].filter(Boolean),
      };

      const quoteService = (await import("../../services/quoteService"))
        .default;

      const response = await quoteService.createQuote(quotePayload);

      console.log("Quote created:", response);

      const { addToast } = useDashboardStore.getState();
      addToast({
        type: "success",
        message:
          response?.message ||
          `Quote submitted! ${
            response?.data?.providersNotified || 0
          } providers notified.`,
      });

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
        preferredDate: null,
        preferredTimeSlot: null,
        notes: "",
        vehicleImages: {
          frontView: null,
          vinLicenceDisc: null,
          damagePhotos: [],
        },
      });
      setModelSearchQuery("");
      setCurrentStep(1);

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

  // Stepper config
  const steps = [
    { label: "Vehicle Details", icon: Car },
    { label: "Service Info", icon: Wrench },
    { label: "Location", icon: MapPin },
  ];

  const getStepState = (stepIndex) => {
    const stepNum = stepIndex + 1;
    if (stepNum < currentStep) return "done";
    if (stepNum === currentStep) return "now";
    return "next";
  };

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
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Close button */}
          <button
            onClick={() => onClose()}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all z-10"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Request a{" "}
              <span className="text-primary-600 dark:text-primary-400 italic">
                Quote
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[460px] mx-auto leading-relaxed">
              Quick, easy, and free. Enter your details below to receive
              competitive quotes from trusted professionals.
            </p>
          </div>

          {/* Icon Stepper */}
          <div className="max-w-md mx-auto">
            {/* Circles + Lines */}
            <div className="flex items-center mb-2">
              {steps.map((step, i) => {
                const state = getStepState(i);
                const StepIcon = step.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center ${i < steps.length - 1 ? "flex-1" : "flex-none"}`}
                  >
                    {/* Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                        state === "done"
                          ? "bg-primary-600 text-white"
                          : state === "now"
                            ? "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-[1.5px] border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {state === "done" ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <StepIcon size={16} />
                      )}
                    </div>
                    {/* Line */}
                    {i < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${
                          i + 1 < currentStep
                            ? "bg-primary-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div className="flex justify-between">
              {steps.map((step, i) => {
                const state = getStepState(i);
                return (
                  <div
                    key={i}
                    className={`text-[11px] font-semibold text-center ${
                      i < steps.length - 1 ? "flex-1" : "flex-none"
                    } ${
                      state === "done"
                        ? "text-primary-600 dark:text-primary-400"
                        : state === "now"
                          ? "text-primary-700 dark:text-primary-300 font-bold"
                          : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Vehicle Details */}
          {currentStep === 1 && (
            <div>
              <div className="mb-1">
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  STEP 1 OF {TOTAL_STEPS}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-0.5">
                Vehicle Details
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Tell us about your vehicle
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <PremiumSelect
                  label="Vehicle Make"
                  required
                  value={formData.vehicleMake}
                  options={availableMakes}
                  onChange={(val) => handleChange("vehicleMake", val)}
                  placeholder="Search make"
                  error={errors.vehicleMake}
                  isSearchable
                  isCreatable
                  isClearable
                  loading={isFetchingMakes}
                  hideArrow
                />

                <PremiumSelect
                  label="Vehicle Model"
                  required
                  value={formData.vehicleModel}
                  options={availableModels}
                  onChange={(val) => handleChange("vehicleModel", val)}
                  placeholder={
                    !formData.vehicleMake ? "Search make first" : "Search model"
                  }
                  error={errors.vehicleModel}
                  isSearchable
                  isCreatable
                  isClearable
                  disabled={!formData.vehicleMake}
                  loading={isFetchingModels}
                  emptyMessage={
                    !formData.vehicleMake
                      ? "Please select a make first"
                      : "No models found"
                  }
                  autoOpen={suggestedField === "vehicleModel"}
                  hideArrow
                />
              </div>

              <div className="max-w-[50%]">
                <PremiumSelect
                  label="Year"
                  value={formData.vehicleYear}
                  options={years.map(String)}
                  onChange={(val) => handleChange("vehicleYear", val)}
                  placeholder="Search year"
                  isSearchable
                  hideArrow
                />
              </div>
            </div>
          )}

          {/* Step 2: Service Info */}
          {currentStep === 2 && (
            <div>
              <div className="mb-1">
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  STEP 2 OF {TOTAL_STEPS}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-0.5">
                Service Info
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                What service do you need?
              </p>

              {/* Service Type Cards */}
              <div className="mb-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Wrench
                    size={13}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  Service Type{" "}
                  <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {adminServiceTypes.map((st) => {
                  const isSelected = formData.serviceTypes?.includes(st.name);
                  return (
                    <button
                      key={st.name}
                      type="button"
                      onClick={() => handleToggleService(st.name)}
                      className={`relative p-4 rounded-xl border-[1.5px] text-left transition-all ${
                        isSelected
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                      }`}
                    >
                      {/* Check circle */}
                      <div
                        className={`absolute top-3 right-3 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary-600 border-primary-600"
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && (
                          <Check
                            size={11}
                            strokeWidth={3}
                            className="text-white"
                          />
                        )}
                      </div>
                      <div className="font-bold text-[15px] text-slate-900 dark:text-white pr-6 mb-0.5">
                        {st.name}
                      </div>
                      <div className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
                        {st.name.toLowerCase().includes("replacement")
                          ? "Full windscreen and window replacement"
                          : st.name.toLowerCase().includes("repair")
                            ? "Chip and crack repair services"
                            : st.name.toLowerCase().includes("smash")
                              ? "Anti-Smash and Grab Film application"
                              : st.name}
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.serviceType && (
                <p className="text-red-500 text-sm mb-4">
                  {errors.serviceType}
                </p>
              )}

              {/* Glass Type per service */}
              {formData.serviceSelections &&
                formData.serviceSelections.length > 0 && (
                  <div className="space-y-4 mb-5">
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
                          className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Wrench
                              size={15}
                              className="text-primary-600 dark:text-primary-400"
                            />
                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                              {selection.serviceName}
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                                  className={`p-2 rounded-lg border-[1.5px] text-xs font-semibold text-center transition-all leading-tight ${
                                    isSelected
                                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
                                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:border-primary-600 dark:hover:text-primary-300 dark:hover:bg-primary-900/10"
                                  }`}
                                >
                                  {glassName}
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
                <p className="text-red-500 text-sm mb-4">{errors.glassType}</p>
              )}

              {/* Vehicle Features - Only for Windscreen */}
              {formData.glassTypes.includes("Windscreen") && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Vehicle Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleChange("hasAdasCamera", !formData.hasAdasCamera)
                      }
                      className={`flex items-center gap-3 p-3 rounded-xl border-[1.5px] transition-all text-left ${
                        formData.hasAdasCamera
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
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
                      className={`flex items-center gap-3 p-3 rounded-xl border-[1.5px] transition-all text-left ${
                        formData.hasRainSensor
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
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

              {/* Vehicle Photos */}
              <div className="mb-5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <Upload
                    size={13}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  Vehicle Photos{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-[13px] text-slate-400 dark:text-slate-500 mb-3">
                  Upload required photos to verify your vehicle. (PNG, JPG up to 5MB each)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <ImageUploadSlot
                    icon={BsCarFrontFill}
                    label="Front of Vehicle"
                    description="Clear front view of your car"
                    image={formData.vehicleImages.frontView}
                    onUpload={(img) => handleSingleImageUpload("frontView", img)}
                    onRemove={() => removeSingleImage("frontView")}
                    error={errors.frontView}
                  />
                  <ImageUploadSlot
                    icon={HiIdentification}
                    label="VIN / Licence Disc"
                    description="Photo of your licence disc or VIN plate"
                    image={formData.vehicleImages.vinLicenceDisc}
                    onUpload={(img) => handleSingleImageUpload("vinLicenceDisc", img)}
                    onRemove={() => removeSingleImage("vinLicenceDisc")}
                    error={errors.vinLicenceDisc}
                  />
                </div>

                <ImageUploadSlot
                  icon={MdPhotoCamera}
                  label="Damaged Area"
                  description="Photos of the damage — upload at least one"
                  images={formData.vehicleImages.damagePhotos}
                  onUpload={handleDamagePhotoUpload}
                  onRemove={removeDamagePhoto}
                  error={errors.damagePhotos}
                  multiple
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Damage Description{" "}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Describe the damage or any additional notes..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div>
              <div className="mb-1">
                <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  STEP 3 OF {TOTAL_STEPS}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-0.5">
                Service Location
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Where should we perform the service?
              </p>

              <div className="mb-4">
                <PremiumSelect
                  label="City / Area"
                  required
                  value={formData.city}
                  options={cities}
                  onChange={(val) => handleChange("city", val)}
                  placeholder="Select your city"
                  error={errors.city}
                  isSearchable
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Street Address{" "}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  placeholder="e.g. 14 Sandton Drive"
                  className="w-full px-3 py-[9.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Suburb{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.suburb}
                    onChange={(e) => handleChange("suburb", e.target.value)}
                    placeholder="e.g. Sandton"
                    className="w-full px-3 py-[9.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Postcode{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={(e) => handleChange("postcode", e.target.value)}
                    placeholder="e.g. 2196"
                    className="w-full px-3 py-[9.5px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {/* Trust Indicators (on last step) */}
          {currentStep === TOTAL_STEPS && (
            <div className="flex justify-center gap-5 mb-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                <Shield size={14} className="text-green-500" />
                Verified providers
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                <Clock size={14} className="text-green-500" />
                Free, no obligation
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                <Users size={14} className="text-green-500" />
                Multiple quotes
              </span>
            </div>
          )}

          <div className="flex justify-between items-center gap-3">
            {/* Back */}
            <button
              type="button"
              onClick={currentStep === 1 ? () => onClose() : handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[15px] font-medium text-slate-500 dark:text-slate-400 rounded-lg hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {/* Next / Submit */}
            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-[15px] rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold text-[15px] rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Quote Request
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestQuoteModal;
