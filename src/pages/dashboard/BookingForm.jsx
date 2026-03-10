import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Car,
  Calendar,
  MapPin,
  MessageSquare,
  FileText,
  Clock,
  Star,
  Shield,
  Building2,
  User,
  Plus,
  X,
  Upload,
  Trash2,
  Search,
} from "lucide-react";
import useDashboardStore, {
  formatCurrency,
  formatDate,
} from "../../store/useDashboardStore";
import bookingService from "../../services/bookingService";
import profileService from "../../services/profileService";
import vehicleService from "../../services/vehicleService";
import geocodingService from "../../services/geocodingService";
import publicSettingsService from "../../services/publicSettingsService";
import Button from "../../components/ui/Button";
import Modal, { ModalActions } from "../../components/ui/Modal";
// vehicleMakes static import removed — now sourced from database via vehicleService
import { CITIES } from "../../data/cities";
import PremiumSelect from "../../components/ui/PremiumSelect";
import PremiumDatePicker from "../../components/ui/PremiumDatePicker";
import { getTodayString, formatLocalDate } from "../../utils/dateUtils";
import { formatDuration } from "../../utils/formatDuration";

const steps = [
  { id: 1, title: "Service", icon: FileText },
  { id: 2, title: "Date & Time", icon: Calendar },
  { id: 3, title: "Address", icon: MapPin },
  { id: 4, title: "Details", icon: MessageSquare },
  { id: 5, title: "Review", icon: Check },
];

const BookingForm = () => {
  const {
    searchCriteria,
    addresses,
    vehicles,
    addAddress,
    addToast,
    setAddresses,
    setVehicles,
  } = useDashboardStore();

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasCheckedActive = useRef(false);

  // Check for active searching/accepted bookings on mount
  useEffect(() => {
    if (hasCheckedActive.current) return;
    hasCheckedActive.current = true;

    const checkActiveBookings = async () => {
      try {
        // Check for searching bookings
        const searchingRes = await bookingService.getBookings({
          status: "searching",
        });
        if (searchingRes.success && searchingRes.data?.length > 0) {
          const activeBooking = searchingRes.data[0];
          addToast({
            type: "info",
            message:
              "You have an active booking request searching for providers.",
          });
          navigate(
            `/dashboard/booking/searching/${
              activeBooking._id || activeBooking.id
            }`,
          );
          return;
        }

        // Check for accepted bookings that still need payment
        const acceptedRes = await bookingService.getBookings({
          status: "accepted",
        });
        if (acceptedRes.success && acceptedRes.data?.length > 0) {
          // Check if it's unpaid
          const unpaidBooking = acceptedRes.data.find(
            (b) => (b.paymentStatus || "").toLowerCase() === "unpaid",
          );
          if (unpaidBooking) {
            addToast({
              type: "info",
              message: "You have an accepted booking pending payment.",
            });
            // These would normally show up in the detail drawer or a specific pending page
            // For now, let's just let them know they should check their bookings
          }
        }
      } catch (err) {}
    };

    checkActiveBookings();
  }, [addToast, navigate]);

  // Fetch saved data if missing from store
  useEffect(() => {
    const fetchSavedData = async () => {
      // Fetch vehicles
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

      // Fetch addresses
      if (addresses.length === 0) {
        try {
          const res = await profileService.getAddresses();
          if (res.success && res.data) {
            const mappedAddresses = res.data.map((a) => ({
              ...a,
              id: a._id,
              label: a.label,
              line1: a.addressLine1, // Consistency for BookingForm
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
  }, [addresses.length, setAddresses, setVehicles, vehicles.length]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const provider = null; // Uber Flow: No specific provider pre-selected
  const preSelectedService = location.state?.selectedService;

  const [currentStep, setCurrentStep] = useState(1);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    line1: "",
    suburb: "",
    city: "",
    postcode: "",
  });

  const [formData, setFormData] = useState({
    // Step 1: Service & Vehicle
    // Service must be explicitly selected by the user
    serviceTypes:
      searchCriteria?.serviceTypes ||
      (searchCriteria?.serviceType ? [searchCriteria.serviceType] : []),
    vehicle: {
      make: searchCriteria?.vehicleMake || "",
      model: searchCriteria?.vehicleModel || "",
      year: searchCriteria?.vehicleYear || new Date().getFullYear().toString(),
      hasAdasCamera: false,
      hasRainSensor: false,
    },
    glassTypes:
      searchCriteria?.glassTypes ||
      (searchCriteria?.glassType ? [searchCriteria.glassType] : []),

    // Step 2: Date & Time
    scheduledDate: "",
    timeSlot: "",

    // Step 3: Address
    address: null,

    // Step 4: Remarks & Images
    remarks: "",
    uploadedImages: [],
    serviceSelections: searchCriteria?.serviceSelections || [], // [{serviceName, serviceType, glassTypes: []}]
  });

  const [errors, setErrors] = useState({});
  const [availableModels, setAvailableModels] = useState([]);
  const [availableMakes, setAvailableMakes] = useState([]);
  const [makeLookup, setMakeLookup] = useState({}); // name → _id
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isFetchingMakes, setIsFetchingMakes] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [suggestedField, setSuggestedField] = useState(null);
  const [providerCount, setProviderCount] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Dynamic data from admin settings
  const [cities, setCities] = useState(CITIES);
  const [glassTypes, setGlassTypes] = useState([]);
  const [adminServiceTypes, setAdminServiceTypes] = useState([]); // Store service types with pricing
  const [platformFeePercent, setPlatformFeePercent] = useState(10); // Platform commission percentage
  const [platformFeeType, setPlatformFeeType] = useState("percentage"); // Commission type: percentage or fixed

  // Fetch public settings (cities, glass types, service types with pricing)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await publicSettingsService.getPublicSettings();
        setCities(CITIES);
        setGlassTypes(settings.glassTypes || []);

        // Store full service type objects with pricing
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

        setAdminServiceTypes(fetchedServices);
      } catch (error) {
        console.error("Failed to fetch public settings:", error);
        // Set fallback defaults
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
        setAdminServiceTypes([
          {
            id: "replacement",
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
            id: "repair",
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
            id: "tinting",
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

  // Fetch platform commission percentage
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const commissionData = await publicSettingsService.getCommission();
        setPlatformFeePercent(commissionData.percentage || 10);
        setPlatformFeeType(commissionData.type || "percentage");
      } catch (error) {
        console.error("Failed to fetch commission:", error);
        setPlatformFeePercent(10); // Fallback to 10%
        setPlatformFeeType("percentage"); // Fallback to percentage
      }
    };
    fetchCommission();
  }, []);

  // Check availability when relevant fields change
  useEffect(() => {
    const checkTimer = setTimeout(async () => {
      // Basic validation - need service type and location (address or city)
      const hasLocation =
        formData.address || (formData.city && formData.city.length > 0);

      if (formData.service && hasLocation) {
        setCheckingAvailability(true);
        try {
          // Normalize serviceType to match backend expectations ("replacement" or "repair")
          const serviceName = formData.service?.name || formData.service || "";
          const normalizedServiceType =
            formData.service?.id ||
            (serviceName.toLowerCase().includes("repair")
              ? "repair"
              : serviceName.toLowerCase().includes("replacement")
                ? "replacement"
                : "tinting");

          // Normalize glassType to lowercase with dashes (e.g., "Windscreen" -> "windscreen")
          const normalizedGlassType = (formData.glassType || "windscreen")
            .toLowerCase()
            .replace(/\s+/g, "-");

          // Build payload with normalized values
          const payload = {
            serviceType: normalizedServiceType,
            glassType: normalizedGlassType,
            vehicle: formData.vehicle,
            serviceAddress: formData.address || { city: formData.city },
            scheduledDate: formData.scheduledDate,
            scheduledTimeSlot: formData.timeSlot,
            serviceLocationType: "mobile",
          };

          const res = await bookingService.checkAvailability(payload);
          if (res.success) {
            setProviderCount(res.data.count);
          }
        } catch (e) {
          setProviderCount(0);
        } finally {
          setCheckingAvailability(false);
        }
      } else {
        setProviderCount(null);
      }
    }, 1000); // Debounce 1s

    return () => clearTimeout(checkTimer);
  }, [
    formData.service,
    formData.glassType,
    formData.vehicle,
    formData.address,
    formData.city,
    formData.scheduledDate,
    formData.timeSlot,
  ]);

  // Fetch makes on mount — map to name strings and build lookup
  useEffect(() => {
    const fetchMakes = async () => {
      setIsFetchingMakes(true);
      try {
        const makes = await vehicleService.getAllMakes();
        if (makes && makes.length > 0) {
          const nameStrings = makes.map((m) => m.name);
          const lookup = {};
          makes.forEach((m) => { lookup[m.name] = m._id; });
          setAvailableMakes(nameStrings);
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

  // Pre-fill and normalize service selections from searchCriteria after admin service types are loaded
  useEffect(() => {
    if (adminServiceTypes.length === 0 || glassTypes.length === 0) return;

    let hasChanges = false;
    let newServices = formData.serviceTypes || [];
    let newGlass = formData.glassTypes || [];
    let newServiceSelections = [...(formData.serviceSelections || [])];

    // Build service selections if missing but we have service types
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

        const def = adminServiceTypes.find((st) => st.name === serviceName);
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
        serviceSelections: newServiceSelections,
      }));
    }
  }, [
    adminServiceTypes,
    glassTypes,
    formData.serviceTypes,
    formData.glassTypes,
    formData.serviceSelections,
  ]);

  // Pre-fill from saved details (Uber Style)
  useEffect(() => {
    // Fill Vehicle
    if (!formData.vehicle.make && vehicles.length > 0) {
      const defaultVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          make: defaultVehicle.make,
          model: defaultVehicle.model,
          year: defaultVehicle.year.toString(),
        },
      }));
    }

    // Fill Address
    if (!formData.address && addresses.length > 0) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      setFormData((prev) => ({
        ...prev,
        address: defaultAddress,
      }));
    }
  }, [vehicles, addresses]);

  // Get available dates
  const availableDates = useMemo(() => {
    if (provider?.availability) {
      const today = getTodayString();
      return provider.availability.filter((a) => a.date >= today);
    }

    // Uber Flow: Generate next 7 days as available
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        date: formatLocalDate(d),
        slots: [
          "06:00 - 08:00",
          "08:00 - 10:00",
          "10:00 - 12:00",
          "12:00 - 14:00",
          "14:00 - 16:00",
          "16:00 - 18:00",
          "18:00 - 20:00",
        ],
      });
    }
    return dates;
  }, [provider]);

  // Get available slots for selected date
  const availableSlots = useMemo(() => {
    if (!formData.scheduledDate) return [];

    if (provider?.availability) {
      const dateEntry = provider.availability.find(
        (a) => a.date === formData.scheduledDate,
      );
      return dateEntry?.slots || [];
    }

    // Uber Flow: Return standard time slots
    return [
      "06:00 - 08:00",
      "08:00 - 10:00",
      "10:00 - 12:00",
      "12:00 - 14:00",
      "14:00 - 16:00",
      "16:00 - 18:00",
      "18:00 - 20:00",
    ];
  }, [formData.scheduledDate, provider]);

  // No provider check needed for Uber style

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    if (field === "scheduledDate") {
      setFormData((prev) => ({ ...prev, scheduledDate: value, timeSlot: "" }));
      setSuggestedField("timeSlot");
    }

    if (field === "timeSlot") {
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
        glassTypes: Array.from(allSelectedGlass),
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

  const updateVehicle = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      vehicle: { ...prev.vehicle, [field]: value },
    }));

    if (field === "make") {
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          make: value,
          model: "",
        },
      }));
      setAvailableModels([]);
      setSuggestedField("model");

      // If not in the existing makes list it is a user-created entry
      if (value && !availableMakes.includes(value)) {
        vehicleService.createMake(value).then((created) => {
          if (created?._id) {
            setAvailableMakes((prev) =>
              prev.includes(value) ? prev : [...prev, value],
            );
            setMakeLookup((prev) => ({ ...prev, [value]: created._id }));
          }
        }).catch(() => {});
      }
    }

    if (field === "model") {
      setSuggestedField(null);

      // If not in the existing models list it is a user-created entry
      if (value && !availableModels.includes(value) && formData.vehicle.make) {
        const makeIdOrName = makeLookup[formData.vehicle.make] || formData.vehicle.make;
        vehicleService.createModel(makeIdOrName, value).then(() => {
          setAvailableModels((prev) =>
            prev.includes(value) ? prev : [...prev, value],
          );
        }).catch(() => {});
      }
    }
  };

  // Fetch models dynamically — use _id from lookup when available, fall back to name
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.vehicle.make) return;
      setIsFetchingModels(true);
      try {
        const makeIdOrName = makeLookup[formData.vehicle.make] || formData.vehicle.make;
        const models = await vehicleService.getModelsByMake(makeIdOrName);
        setAvailableModels(models.map((m) => m.name));
      } catch (err) {
        setAvailableModels([]);
      } finally {
        setIsFetchingModels(false);
      }
    };

    fetchModels();
  }, [formData.vehicle.make, makeLookup]);

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        // Check service type first (new flow: service → glass type)
        if (!formData.serviceTypes || formData.serviceTypes.length === 0)
          newErrors.service = "Please select a service";
        if (!formData.glassTypes || formData.glassTypes.length === 0)
          newErrors.glassType = "Glass type is required";
        if (!formData.vehicle.make)
          newErrors.vehicleMake = "Vehicle make is required";
        if (!formData.vehicle.model)
          newErrors.vehicleModel = "Vehicle model is required";
        break;
      case 2:
        if (!formData.scheduledDate)
          newErrors.scheduledDate = "Please select a date";
        if (!formData.timeSlot)
          newErrors.timeSlot = "Please select a time slot";
        break;
      case 3:
        if (!formData.address) newErrors.address = "Please select an address";
        break;
      case 4:
        if (!formData.uploadedImages || formData.uploadedImages.length === 0)
          newErrors.uploadedImages = "At least one photo is required";
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validImages = [];

    for (const file of files) {
      if (
        file.type.startsWith("image/") ||
        file.name.toLowerCase().endsWith(".heic")
      ) {
        let fileToProcess = file;

        // Handle HEIC images
        if (
          file.type === "image/heic" ||
          file.name.toLowerCase().endsWith(".heic")
        ) {
          try {
            if (window.heic2any) {
              const loadingId = addToast({
                type: "info",
                message: "Processing HEIC image...",
              });
              const result = await window.heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.7,
              });

              const blob = Array.isArray(result) ? result[0] : result;
              fileToProcess = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                {
                  type: "image/jpeg",
                },
              );
              // Note: addToast return ID is used for removal if store supports it,
              // otherwise we just let it fade.
            }
          } catch (err) {
            console.error("HEIC conversion failed:", err);
            addToast({ type: "error", message: "Failed to process HEIC file" });
            continue;
          }
        }

        validImages.push({
          id: URL.createObjectURL(fileToProcess),
          url: URL.createObjectURL(fileToProcess),
          name: fileToProcess.name,
          file: fileToProcess,
        });
      }
    }

    updateFormData("uploadedImages", [
      ...formData.uploadedImages,
      ...validImages,
    ]);
  };

  const handleRemoveImage = (imageId) => {
    updateFormData(
      "uploadedImages",
      formData.uploadedImages.filter((img) => img.id !== imageId),
    );
  };

  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  const handleAddAddress = async () => {
    if (!newAddress.line1 || !newAddress.city) {
      addToast({ type: "error", message: "Please fill in required fields" });
      return;
    }

    setIsSubmittingAddress(true);
    let coords = null;
    try {
      // Construct clean address for better matching
      const parts = [
        newAddress.line1,
        newAddress.suburb,
        newAddress.city,
        "South Africa",
      ].filter(Boolean);
      const fullAddress = parts.join(", ");

      coords = await geocodingService.getCoordinates(fullAddress);

      // Fallback: Try just suburb and city if full address fails
      if (!coords && newAddress.suburb && newAddress.city) {
        coords = await geocodingService.getCoordinates(
          `${newAddress.suburb}, ${newAddress.city}, South Africa`,
        );
      }

      // Fallback: Try just city if that fails
      if (!coords && newAddress.city) {
        coords = await geocodingService.getCoordinates(
          `${newAddress.city}, South Africa`,
        );
      }

      const apiPayload = {
        label: newAddress.label,
        addressLine1: newAddress.line1,
        suburb: newAddress.suburb,
        city: newAddress.city,
        postalCode: newAddress.postcode,
        coordinates: coords,
        isDefault: addresses.length === 0,
      };

      let addressToAdd = { ...newAddress, coordinates: coords };

      // Sync with backend profile
      const res = await profileService.addAddress(apiPayload);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Backend returns array of addresses, get the last one (newest)
        const savedBackendAddress = res.data[res.data.length - 1];

        addressToAdd = {
          ...addressToAdd,
          ...savedBackendAddress,
          id: savedBackendAddress._id,
          line1: savedBackendAddress.addressLine1, // Keep local consistency
        };
      }

      const id = addAddress(addressToAdd);

      setFormData((prev) => ({
        ...prev,
        address: { ...addressToAdd, id: id },
      }));
      setIsAddressModalOpen(false);
      setNewAddress({
        label: "Home",
        line1: "",
        suburb: "",
        city: "",
        postcode: "",
      });
    } catch (e) {
      console.error("Error in handleAddAddress:", e);
      addToast({
        type: "error",
        message: e?.message || "Failed to save address",
      });
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.serviceTypes?.length ||
      !formData.address ||
      !formData.vehicle
    ) {
      addToast({ type: "error", message: "Incomplete booking details" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload images first
      let uploadedImageUrls = [];
      const imagesToUpload = formData.uploadedImages.filter((img) => img.file);

      if (imagesToUpload.length > 0) {
        try {
          const imageFormData = new FormData();
          imagesToUpload.forEach((img) => {
            imageFormData.append("damageImages", img.file);
          });

          const uploadRes =
            await bookingService.uploadDamageImages(imageFormData);
          if (uploadRes.success && uploadRes.data?.images) {
            uploadedImageUrls = uploadRes.data.images;
          }
        } catch (uploadErr) {
          addToast({
            type: "warning",
            message: "Failed to upload images, continuing with booking...",
          });
        }
      }

      // Get the actual service price for the selected glass type
      let servicePrice = 0;
      formData.serviceTypes.forEach((serviceName) => {
        const adminService = adminServiceTypes.find(
          (st) => st.name === serviceName,
        );
        if (adminService) {
          formData.glassTypes.forEach((gt) => {
            const pricingEntry = adminService.pricing?.find(
              (p) => p.glassType === gt,
            );
            if (pricingEntry) {
              servicePrice += pricingEntry.price;
            }
          });
        }
      });
      if (servicePrice === 0 && formData.serviceTypes.length > 0) {
        formData.serviceTypes.forEach((serviceName) => {
          const adminService = adminServiceTypes.find(
            (st) => st.name === serviceName,
          );
          if (adminService) servicePrice += adminService.fromPrice || 0;
        });
      }

      // Calculate commission (lock in current rates)
      const commissionAmount =
        platformFeeType === "percentage"
          ? Math.round(servicePrice * (platformFeePercent / 100) * 100) / 100
          : platformFeePercent;
      const providerEarnings = servicePrice - commissionAmount;

      console.log("🔍 Commission Debug:", {
        servicePrice,
        platformFeeType,
        platformFeePercent,
        commissionAmount,
        providerEarnings,
      });

      const bookingData = {
        provider: provider?.id || null, // Optional for broadcast flow
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
        vehicle: {
          make: formData.vehicle.make,
          model: formData.vehicle.model,
          year: parseInt(formData.vehicle.year) || new Date().getFullYear(),
          hasAdasCamera: formData.vehicle.hasAdasCamera,
          hasRainSensor: formData.vehicle.hasRainSensor,
        },
        scheduledDate: formData.scheduledDate,
        scheduledTimeSlot: formData.timeSlot,
        serviceLocationType: "mobile", // Default to mobile for now as per flow
        city: searchCriteria?.city || "Johannesburg", // Used for radius matching
        serviceAddress: {
          addressLine1: formData.address.line1,
          city: formData.address.city,
          province: "Gauteng", // Hardcoded for now
          postalCode: formData.address.postcode,
          coordinates: formData.address.coordinates,
        },
        price: {
          subtotal: servicePrice,
          total: servicePrice, // Customer pays the service price (Uber model)
        },
        commission: {
          type: platformFeeType, // Lock in commission type (percentage/fixed)
          rate: platformFeePercent, // Lock in commission rate
          amount: commissionAmount, // Calculated commission
          platformFee: commissionAmount, // Backwards compatibility
          providerEarnings: providerEarnings, // What provider receives
        },
        customerNotes: formData.remarks,
        damageImages: uploadedImageUrls, // Add uploaded images to booking
        serviceSelections: formData.serviceSelections,
      };

      // Final safety net: Ensure coordinates are present
      if (!bookingData.serviceAddress.coordinates) {
        try {
          const addrStr = `${bookingData.serviceAddress.addressLine1 || ""}, ${
            bookingData.serviceAddress.city
          }, South Africa`.replace(/^, /, "");
          const jitCoords = await geocodingService.getCoordinates(addrStr);
          if (jitCoords) {
            bookingData.serviceAddress.coordinates = jitCoords;
          }
        } catch (e) {}
      }

      const res = await bookingService.createBookingRequest(bookingData);

      const newBookingId = res?.data?.bookingId || res?.bookingId;

      if (!newBookingId) {
        addToast({
          type: "error",
          message: "Booking created but no ID returned",
        });
        return;
      }

      addToast({ type: "success", message: "Booking request sent!" });
      navigate(`/dashboard/booking/searching/${newBookingId}`);
    } catch (error) {
      addToast({
        type: "error",
        message: error?.error || error?.message || "Failed to create booking",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-4">
        <Link
          to="/dashboard/book"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl transition-colors bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-primary-400 hover:text-primary-600"
        >
          <ArrowLeft size={16} />
          Back to Search
        </Link>
      </div>

      {/* Search Context Summary (Uber Style) */}
      {!provider && (
        <div className="bg-primary-600 rounded-xl p-4 mb-6 shadow-md text-white">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Search size={20} />
            Finding best provider in {searchCriteria?.city || "your area"}
          </h2>
          <p className="text-primary-100 text-sm">
            We'll broadcast your request to all trusted providers nearby.
          </p>
        </div>
      )}

      {/* Provider Summary (Only if specific requested) */}
      {provider && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {provider.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {provider.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Star size={14} className="text-amber-400" fill="currentColor" />
              {provider.rating} ({provider.reviewsCount} reviews)
              <span className="mx-1">•</span>
              <MapPin size={14} />
              {provider.address.city}
            </div>
          </div>
        </div>
      )}

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
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-primary-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-20 h-0.5 mx-2 ${
                      currentStep > step.id
                        ? "bg-green-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
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
            {/* Service Type Selection - FIRST */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Select Service Types
              </h3>
              <div className="space-y-3">
                {adminServiceTypes.map((serviceType) => {
                  const isSelected = formData.serviceTypes?.includes(
                    serviceType.name,
                  );

                  return (
                    <div
                      key={serviceType.id || serviceType.name}
                      onClick={() => handleToggleService(serviceType.name)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600 ring-1 ring-primary-500"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 pr-8">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {serviceType.name}
                            </h4>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {serviceType.description}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Clock size={12} /> ~
                            {formatDuration(serviceType.name.toLowerCase().includes("repair")
                              ? 45
                              : 90)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.service && (
                <p className="text-sm text-danger-500 mt-2">{errors.service}</p>
              )}
            </div>

            {/* Glass Type Selection - SECOND (Grouped by Service) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 mt-6">
                Select Glass for Each Service{" "}
                <span className="text-red-500">*</span>
              </h3>

              {formData.serviceSelections &&
              formData.serviceSelections.length > 0 ? (
                <div className="space-y-6">
                  {formData.serviceSelections.map((selection) => {
                    const serviceDef = adminServiceTypes.find(
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
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <FileText size={16} />
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {selection.serviceName}
                          </h3>
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
                                <span className={`${isSelected ? "pr-3" : ""}`}>
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
              ) : (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    ℹ️ Please select a service type above first
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Available glass types will be shown based on your service
                    selection.
                  </p>
                </div>
              )}
              {errors.glassType && (
                <p className="text-red-500 text-sm mt-1">{errors.glassType}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Vehicle Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.length > 0 && (
                  <div className="md:col-span-3 mb-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                      Quick Select Saved Vehicle
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {vehicles.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              vehicle: {
                                make: v.make,
                                model: v.model,
                                year: v.year.toString(),
                                hasAdasCamera: v.hasAdasCamera || false,
                                hasRainSensor: v.hasRainSensor || false,
                              },
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            formData.vehicle.make === v.make &&
                            formData.vehicle.model === v.model
                              ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-300"
                              : "bg-white border-slate-200 text-slate-600 hover:border-primary-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                          }`}
                        >
                          <Car size={12} />
                          {v.year} {v.make} {v.model}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <PremiumSelect
                  label="Make"
                  required
                  value={formData.vehicle.make}
                  options={availableMakes}
                  onChange={(val) => updateVehicle("make", val)}
                  placeholder="Select make"
                  error={errors.vehicleMake}
                  isSearchable
                  isCreatable
                  isClearable
                  loading={isFetchingMakes}
                />

                <PremiumSelect
                  label="Model"
                  required
                  value={formData.vehicle.model}
                  options={availableModels}
                  onChange={(val) => updateVehicle("model", val)}
                  placeholder={
                    !formData.vehicle.make
                      ? "Select make first"
                      : "Search model"
                  }
                  error={errors.vehicleModel}
                  isSearchable
                  isCreatable
                  isClearable
                  disabled={!formData.vehicle.make}
                  loading={isFetchingModels}
                  emptyMessage={
                    !formData.vehicle.make
                      ? "Please select a make first"
                      : "No models found"
                  }
                  autoOpen={suggestedField === "model"}
                />

                <PremiumSelect
                  label="Year"
                  value={formData.vehicle.year}
                  options={years.map(String)}
                  onChange={(val) => updateVehicle("year", val)}
                  placeholder="Select year"
                />
              </div>

              {/* ADAS & Rain Sensor Options - ONLY for Windscreen */}
              {formData.glassTypes &&
                formData.glassTypes.some(
                  (g) => g.toLowerCase() === "windscreen",
                ) && (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Vehicle Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          updateVehicle(
                            "hasAdasCamera",
                            !formData.vehicle.hasAdasCamera,
                          )
                        }
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          formData.vehicle.hasAdasCamera
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600"
                            : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                            formData.vehicle.hasAdasCamera
                              ? "bg-primary-600 border-primary-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {formData.vehicle.hasAdasCamera && (
                            <Check size={14} />
                          )}
                        </div>
                        <div className="text-left">
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
                          updateVehicle(
                            "hasRainSensor",
                            !formData.vehicle.hasRainSensor,
                          )
                        }
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          formData.vehicle.hasRainSensor
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600"
                            : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                            formData.vehicle.hasRainSensor
                              ? "bg-primary-600 border-primary-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {formData.vehicle.hasRainSensor && (
                            <Check size={14} />
                          )}
                        </div>
                        <div className="text-left">
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
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PremiumDatePicker
                label="Select Date"
                required
                value={formData.scheduledDate}
                onChange={(val) => updateFormData("scheduledDate", val)}
                placeholder="Pick an available date"
                minDate={getTodayString()}
                availableDates={availableDates.map((d) => d.date)}
                error={errors.scheduledDate}
              />

              <PremiumSelect
                label="Select Time Slot"
                required
                icon={Clock}
                value={formData.timeSlot}
                options={availableSlots}
                onChange={(val) => updateFormData("timeSlot", val)}
                placeholder={
                  !formData.scheduledDate ? "Select date first" : "Pick a time"
                }
                disabled={!formData.scheduledDate}
                error={errors.timeSlot}
                autoOpen={suggestedField === "timeSlot"}
              />
            </div>

            {!formData.scheduledDate && availableDates.length > 0 && (
              <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/20">
                <p className="text-sm text-primary-700 dark:text-primary-300 flex items-center gap-2">
                  <Calendar size={16} />
                  Earliest available:{" "}
                  {new Date(availableDates[0].date).toLocaleDateString(
                    "en-ZA",
                    { day: "numeric", month: "long" },
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Address */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Select Service Address
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddressModalOpen(true)}
              >
                <Plus size={16} />
                Add New
              </Button>
            </div>

            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = formData.address?.id === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => updateFormData("address", addr)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-600 dark:text-slate-400">
                              {addr.label}
                            </span>
                            {isSelected && (
                              <Check
                                size={16}
                                className="text-primary-600 dark:text-primary-400"
                              />
                            )}
                          </div>
                          <p className="font-medium text-slate-900 dark:text-white mt-1">
                            {addr.line1}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {addr.suburb && `${addr.suburb}, `}
                            {addr.city} {addr.postcode}
                          </p>
                        </div>
                        <MapPin
                          size={20}
                          className={
                            isSelected
                              ? "text-primary-600 dark:text-primary-400"
                              : "text-slate-400"
                          }
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <MapPin size={32} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 mb-3">
                  No saved addresses
                </p>
                <Button onClick={() => setIsAddressModalOpen(true)}>
                  <Plus size={16} />
                  Add Address
                </Button>
              </div>
            )}
            {errors.address && (
              <p className="text-sm text-danger-500 mt-2">{errors.address}</p>
            )}
          </div>
        )}

        {/* Step 4: Remarks & Images */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Additional Details
              </h3>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Remarks or special instructions (optional)
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => updateFormData("remarks", e.target.value)}
                placeholder="e.g., Crack is on the passenger side, approximately 15cm long. Please call before arriving."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Upload Photos of the damage{" "}
                <span className="text-red-500">*</span>
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
                    <span className="text-primary-600 dark:text-primary-400 font-medium">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </label>
              </div>

              {formData.uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {formData.uploadedImages.map((img) => (
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
              {errors.uploadedImages && (
                <p className="text-sm text-red-500 mt-2">
                  {errors.uploadedImages}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Review Your Booking
            </h3>

            {/* Radios Broadcast Strategy (Uber Style) */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white animate-pulse">
                  <Search size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Radius Broadcast
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Finding best available provider in{" "}
                    {formData.address?.city || searchCriteria?.city}
                  </p>
                </div>
              </div>
            </div>

            {/* Service & Vehicle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Service
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formData.serviceTypes?.join(", ")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.glassTypes?.join(", ")}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Vehicle
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formData.vehicle.year} {formData.vehicle.make}{" "}
                  {formData.vehicle.model}
                </p>
              </div>
            </div>

            {/* Date & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Date & Time
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formatDate(formData.scheduledDate, "long")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.timeSlot}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Address
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formData.address?.line1}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.address?.suburb && `${formData.address.suburb}, `}
                  {formData.address?.city} {formData.address?.postcode}
                </p>
              </div>
            </div>

            {/* Remarks & Images */}
            {(formData.remarks || formData.uploadedImages.length > 0) && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Additional Details
                </p>
                {formData.remarks && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    {formData.remarks}
                  </p>
                )}
                {formData.uploadedImages.length > 0 && (
                  <div className="flex gap-2">
                    {formData.uploadedImages.slice(0, 4).map((img) => (
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

          {/* Provider Availability Indicator */}
          {providerCount !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                providerCount > 0
                  ? "bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                  : "bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  providerCount > 0
                    ? "bg-green-500 animate-pulse"
                    : "bg-orange-500"
                }`}
              />
              {checkingAvailability
                ? "Checking..."
                : providerCount > 0
                  ? `${providerCount} providers available nearby`
                  : "No providers found yet"}
            </div>
          )}

          {currentStep < 5 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Check size={18} />
                  Send Booking Request
                </>
              )}
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
            <PremiumSelect
              label="Label"
              value={newAddress.label}
              options={["Home", "Work", "Other"]}
              onChange={(val) =>
                setNewAddress((prev) => ({ ...prev, label: val }))
              }
              placeholder="Select label"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Street Address *
            </label>
            <input
              type="text"
              value={newAddress.line1}
              onChange={(e) =>
                setNewAddress((prev) => ({ ...prev, line1: e.target.value }))
              }
              placeholder="123 Main Road"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Suburb (optional)
            </label>
            <input
              type="text"
              value={newAddress.suburb}
              onChange={(e) =>
                setNewAddress((prev) => ({ ...prev, suburb: e.target.value }))
              }
              placeholder="Sandton"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <PremiumSelect
                label="City"
                required
                value={newAddress.city}
                options={cities}
                onChange={(val) =>
                  setNewAddress((prev) => ({ ...prev, city: val }))
                }
                placeholder="Search city"
                searchable
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Postcode
              </label>
              <input
                type="text"
                value={newAddress.postcode}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    postcode: e.target.value,
                  }))
                }
                placeholder="2196"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
        <ModalActions>
          <Button
            variant="secondary"
            onClick={() => setIsAddressModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddAddress}
            loading={isSubmittingAddress}
            disabled={isSubmittingAddress}
          >
            {isSubmittingAddress ? "Saving..." : "Add Address"}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default BookingForm;
