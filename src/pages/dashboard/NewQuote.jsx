import {
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
  Truck,
  Building2,
} from "lucide-react";
import useDashboardStore from "../../store/useDashboardStore";
import vehicleService from "../../services/vehicleService";
import geocodingService from "../../services/geocodingService";
import publicSettingsService from "../../services/publicSettingsService";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PremiumSelect from "../../components/ui/PremiumSelect";
import ImageUploadSlot from "../../components/ui/ImageUploadSlot";
import { BsCarFrontFill } from "react-icons/bs";
import { HiIdentification } from "react-icons/hi2";
import { MdPhotoCamera } from "react-icons/md";
import { CITIES } from "../../data/cities";

// Geocode an address string via Nominatim (free, no API key)
const geocodeAddress = async (address) => {
  try {
    const query = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&countrycodes=za&limit=1`,
      { headers: { "User-Agent": "AutoScreen/1.0" } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
};

const TOTAL_STEPS = 3;

const NewQuote = () => {
  const { createQuote, user, vehicles, addresses } = useDashboardStore();
  const location = useLocation();
  const navigate = useNavigate();

  const prefillVehicle = location.state?.prefillVehicle || null;

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
    serviceMode: "mobile",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeConversions, setActiveConversions] = useState(0);
  const handleConversionStateChange = (isConverting) => {
    setActiveConversions((prev) => prev + (isConverting ? 1 : -1));
  };
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

  // Pre-fill vehicle on mount
  useEffect(() => {
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
  }, []);

  // Pre-fill address when cities are loaded
  useEffect(() => {
    if (user && addresses.length > 0 && !formData.city && cities.length > 0) {
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
  }, [user, addresses, cities]);

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

  // Fetch public settings on mount
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
          .catch((err) => {
            console.error("Failed to create vehicle make:", err);
            setAvailableMakes((prev) =>
              [...new Set([...prev, value])].sort(),
            );
          });
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
            .catch((err) => {
              console.error("Failed to create vehicle model:", err);
              setAvailableModels((prev) =>
                [...new Set([...prev, value])].sort(),
              );
            });
        }
      }
    }
  };

  // Match a raw city name from Nominatim to the nearest option in the cities list
  const matchCityToList = (rawCity, cityList) => {
    if (!rawCity) return "";
    const lower = rawCity.toLowerCase();
    const getVal = (c) => (typeof c === "string" ? c : c.value || c.label || "");
    const exact = cityList.find((c) => getVal(c).toLowerCase() === lower);
    if (exact) return getVal(exact);
    const partial = cityList.find((c) => {
      const v = getVal(c).toLowerCase();
      return v.includes(lower) || lower.includes(v);
    });
    if (partial) return getVal(partial);
    return rawCity;
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude },
        }));
        // Reverse geocode to fill in address fields
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "AutoScreen/1.0" } }
          );
          const data = await response.json();
          if (data?.address) {
            const rawCity = data.address.city || data.address.town || data.address.village || "";
            const matchedCity = matchCityToList(rawCity, cities);
            const cityOpt = matchedCity ? cities.find((c) => (typeof c === "string" ? c : c.value) === matchedCity) : null;
            const isCityValid = cityOpt && (typeof cityOpt === "string" || !cityOpt.disabled);
            setFormData((prev) => ({
              ...prev,
              city: isCityValid ? matchedCity : "",
              suburb: data.address.suburb || prev.suburb,
              addressLine1: data.address.road
                ? `${data.address.house_number || ""} ${data.address.road}`.trim()
                : prev.addressLine1,
              postcode: data.address.postcode || prev.postcode,
              coordinates: { lat: latitude, lng: longitude },
            }));
            if (!isCityValid) {
              setErrors((prev) => ({
                ...prev,
                city: matchedCity
                  ? "No providers available in this area yet"
                  : "Could not determine a serviceable city from your location",
              }));
            } else {
              setErrors((prev) => ({ ...prev, city: "" }));
            }
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
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
      if (!formData.city) {
        newErrors.city = "City is required";
      } else {
        const cityOpt = cities.find((c) => (typeof c === "string" ? c : c.value) === formData.city);
        if (!cityOpt || (typeof cityOpt === "object" && cityOpt.disabled)) {
          newErrors.city = "No providers available in this area yet";
        }
      }
      if (formData.serviceMode !== "workshop" && !formData.addressLine1.trim())
        newErrors.addressLine1 = "Street address is required";
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
    if (!formData.city) {
      newErrors.city = "City is required";
    } else {
      const cityOpt = cities.find((c) => (typeof c === "string" ? c : c.value) === formData.city);
      if (!cityOpt || (typeof cityOpt === "object" && cityOpt.disabled)) {
        newErrors.city = "No providers available in this area yet";
      }
    }
    if (formData.serviceMode !== "workshop" && (!formData.addressLine1 || !formData.addressLine1.trim()))
      newErrors.addressLine1 = "Street address is required";
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
      } else if (errors.serviceType || errors.glassType || errors.frontView || errors.vinLicenceDisc || errors.damagePhotos) {
        setCurrentStep(2);
      } else if (errors.city) {
        setCurrentStep(3);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      let finalCoordinates = formData.coordinates;
      if (!finalCoordinates?.lat && formData.city) {
        try {
          const addressStr = [
            formData.addressLine1,
            formData.suburb,
            formData.city,
          ]
            .filter(Boolean)
            .join(", ");
          finalCoordinates = await geocodeAddress(addressStr + ", South Africa");
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

      // Upload images as files first (avoids base64-in-JSON payload size issues)
      const imageFiles = [
        formData.vehicleImages.frontView?.file,
        formData.vehicleImages.vinLicenceDisc?.file,
        ...formData.vehicleImages.damagePhotos.map((img) => img.file),
      ].filter(Boolean);

      const quoteService = (await import("../../services/quoteService"))
        .default;

      let damageImageUrls = [];
      if (imageFiles.length > 0) {
        const uploadRes = await quoteService.uploadImages(imageFiles);
        if (uploadRes?.success && uploadRes.data?.images) {
          damageImageUrls = uploadRes.data.images;
        } else {
          throw new Error("Failed to upload images. Please try again.");
        }
      }

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
          type: formData.serviceMode || "mobile",
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
        damageImages: damageImageUrls,
      };

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

      const quoteId = response?.data?._id || response?.data?.quoteNumber;
      navigate(`/dashboard/quotes/${quoteId}`);
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Request a{" "}
          <span className="text-primary-600 dark:text-primary-400 italic">
            Quote
          </span>
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Quick, easy, and free. Enter your details below to receive competitive
          quotes from trusted professionals.
        </p>
      </div>

      {/* Stepper */}
      <div className="max-w-md mx-auto">
        {/* Circles + Lines row */}
        <div className="flex items-center">
          {steps.map((step, i) => {
            const state = getStepState(i);
            const StepIcon = step.icon;
            return (
              <React.Fragment key={i}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
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
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                      i + 1 < currentStep
                        ? "bg-primary-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {/* Labels row */}
        <div className="flex justify-between mt-1.5">
          {steps.map((step, i) => {
            const state = getStepState(i);
            return (
              <span
                key={i}
                className={`text-[11px] font-semibold whitespace-nowrap text-center ${
                  i === 0 ? "text-left" : i === steps.length - 1 ? "text-right" : "text-center"
                } ${
                  state === "done"
                    ? "text-primary-600 dark:text-primary-400"
                    : state === "now"
                      ? "text-primary-700 dark:text-primary-300 font-bold"
                      : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Wizard Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/70 dark:border-slate-700/50 overflow-hidden">
        {/* Step Content */}
        <div className="p-6 sm:p-8">
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
                    !formData.vehicleMake ? "Select make first" : "Search model"
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

              <div className="sm:w-1/2 sm:pr-2">
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
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Wrench
                    size={14}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  Service Type <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {adminServiceTypes.map((st) => {
                  const isSelected = formData.serviceTypes?.includes(st.name);
                  return (
                    <button
                      key={st.name}
                      type="button"
                      onClick={() => handleToggleService(st.name)}
                      className={`relative p-5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-600/20 dark:ring-primary-400/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:border-primary-600/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {/* Check circle */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div className="font-semibold text-[15px] text-slate-900 dark:text-white pr-6">
                        {st.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
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
                <p className="text-red-500 text-sm mt-2 mb-4">
                  {errors.serviceType}
                </p>
              )}

              {/* Glass Type per service */}
              {formData.serviceSelections &&
                formData.serviceSelections.length > 0 && (
                  <div className="space-y-6 mb-6">
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
                          className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/30 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                              <Wrench size={16} />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">
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
                                  className={`relative p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                                    isSelected
                                      ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-2 ring-primary-600/20 dark:ring-primary-400/20"
                                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:border-primary-600/50 dark:hover:bg-slate-800/50"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-primary-600 text-white rounded-full flex items-center justify-center">
                                      <Check size={8} strokeWidth={3} />
                                    </div>
                                  )}
                                  <span className={isSelected ? "pr-4" : ""}>{glassName}</span>
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
                <p className="text-red-500 text-sm mt-2 mb-4">{errors.glassType}</p>
              )}

              {/* Vehicle Features - Only for Windscreen */}
              {formData.glassTypes.includes("Windscreen") && (
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Vehicle Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleChange("hasAdasCamera", !formData.hasAdasCamera)
                      }
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                        formData.hasAdasCamera
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-600/20 dark:ring-primary-400/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:border-primary-600/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                          formData.hasAdasCamera
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {formData.hasAdasCamera && <Check size={14} />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          ADAS Camera
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Advanced Driver Assistance System
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleChange("hasRainSensor", !formData.hasRainSensor)
                      }
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                        formData.hasRainSensor
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-600/20 dark:ring-primary-400/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:border-primary-600/50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                          formData.hasRainSensor
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {formData.hasRainSensor && <Check size={14} />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                          Rain / Light Sensor
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Automatic wipers and lights
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Vehicle Photos */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Upload
                    size={14}
                    className="text-slate-400 dark:text-slate-500"
                  />
                  Vehicle Photos <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
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
                    onConversionStateChange={handleConversionStateChange}
                    error={errors.frontView}
                  />
                  <ImageUploadSlot
                    icon={HiIdentification}
                    label="VIN / Licence Disc"
                    description="Photo of your licence disc or VIN plate"
                    image={formData.vehicleImages.vinLicenceDisc}
                    onUpload={(img) => handleSingleImageUpload("vinLicenceDisc", img)}
                    onRemove={() => removeSingleImage("vinLicenceDisc")}
                    onConversionStateChange={handleConversionStateChange}
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
                  onConversionStateChange={handleConversionStateChange}
                  error={errors.damagePhotos}
                  multiple
                />
              </div>

              {/* Notes */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
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

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Service Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange("serviceMode", "mobile")}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      formData.serviceMode === "mobile"
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-600/20 dark:ring-primary-400/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:border-primary-600/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {formData.serviceMode === "mobile" && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div className="mb-1.5"><Truck size={24} className="text-primary-600 dark:text-primary-400" /></div>
                    <div className="font-semibold text-[14px] text-slate-900 dark:text-white">Mobile</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">We come to you</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("serviceMode", "workshop")}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      formData.serviceMode === "workshop"
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-600/20 dark:ring-primary-400/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary-400/50 hover:bg-slate-50 dark:hover:border-primary-600/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {formData.serviceMode === "workshop" && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div className="mb-1.5"><Building2 size={24} className="text-primary-600 dark:text-primary-400" /></div>
                    <div className="font-semibold text-[14px] text-slate-900 dark:text-white">Workshop</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visit a workshop</div>
                  </button>
                </div>
              </div>

              {/* Use My Location */}
              <div className="flex justify-end mb-1">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                >
                  <MapPin size={14} /> Use My Location
                </button>
              </div>

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

              {formData.serviceMode !== "workshop" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Street Address{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) =>
                        handleChange("addressLine1", e.target.value)
                      }
                      placeholder="e.g. 14 Sandton Drive"
                      className={`w-full px-3 py-[9.5px] bg-white dark:bg-slate-800 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-slate-700 dark:text-slate-200 ${
                        errors.addressLine1
                          ? "border-red-400"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    />
                    {errors.addressLine1 && (
                      <p className="mt-1 text-xs text-red-500">{errors.addressLine1}</p>
                    )}
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
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
              onClick={currentStep === 1 ? () => navigate(-1) : handleBack}
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
                disabled={isSubmitting || activeConversions > 0}
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

export default NewQuote;
