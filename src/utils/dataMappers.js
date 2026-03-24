import { NodeURL } from "../services/api";
import { formatDate, formatDateTime, formatTimeSlot } from "./dateUtils";

// Helper functions for formatting
export const formatServiceType = (serviceType) => {
  if (!serviceType) return "-";
  if (Array.isArray(serviceType)) {
    return serviceType.map((st) => formatServiceType(st)).join(", ");
  }
  const st = serviceType.toLowerCase();

  if (st === "replacement") return "Glass Replacement";
  if (st === "repair") return "Glass Repair";
  if (st === "tinting") return "Anti-Smash and Grab Film";

  // Fallback for simple capitalization
  return st.charAt(0).toUpperCase() + st.slice(1);
};

const formatBookingStatus = (status) => {
  if (!status) return "Pending";
  const s = status.toLowerCase();

  switch (s) {
    case "searching":
      return "Searching";
    case "awaiting-customer-approval":
      return "Action Required";
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "awaiting-payment":
      return "Awaiting Payment";
    case "confirmed":
      return "Confirmed";
    case "arrived":
      return "Arrived";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "completed-by-fitter":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    case "rejected":
      return "Rejected";
    case "awaiting-provider-acceptance":
      return "Awaiting Provider";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const formatGlassType = (glassType) => {
  if (!glassType) return "-";
  if (Array.isArray(glassType)) {
    return glassType.map((gt) => formatGlassType(gt)).join(", ");
  }
  const st = glassType.toLowerCase();

  // Special case for common positions
  const positions = ["front-left", "front-right", "rear-left", "rear-right"];
  const foundPosition = positions.find((pos) => st.includes(pos));

  if (foundPosition) {
    const typePart = st
      .replace(foundPosition, "")
      .replace(/-$/, "")
      .replace(/^-/, "");
    const formattedType = typePart
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    const formattedPos = foundPosition
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return `${formattedType} (${formattedPos})`;
  }

  return st
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Map API dashboard data to frontend format
 * @param {Object} apiData - Data from API
 * @returns {Object} Mapped data
 */
export const mapDashboardData = (apiData) => {
  if (!apiData) return null;

  return {
    user: apiData.user
      ? mapUser(apiData.user)
      : apiData.profile
        ? mapUser(apiData.profile)
        : null,
    stats: apiData.stats || {
      activeQuotes: 0,
      upcomingBookings: 0,
      completedJobs: 0,
      pendingPaymentsCount: 0,
      pendingPaymentsTotal: 0,
    },
    recentBookings: (apiData.recentBookings || []).map(mapBooking),
    recentQuotes: (apiData.recentQuotes || []).map(mapQuote),
    nextBooking: mapBooking(apiData.nextBooking),
    activities: apiData.activities || [],
  };
};

/**
 * Map API booking data to frontend format
 */
export const mapBooking = (booking) => {
  if (!booking) return null;

  // Format vehicle string
  const vehicleStr =
    typeof booking.vehicle === "string"
      ? booking.vehicle
      : booking.vehicle
        ? `${booking.vehicle.year || ""} ${booking.vehicle.make || ""} ${
            booking.vehicle.model || ""
          }`.trim()
        : "Unknown Vehicle";

  // Format service name
  const formatServiceName = () => {
    // Check for plural serviceTypes first
    if (booking.serviceTypes?.length > 1) {
      return booking.serviceTypes.map(formatServiceType).join(", ");
    }
    // If service object exists with a name (priority)
    if (typeof booking.service === "object" && booking.service?.name) {
      return booking.service.name;
    }
    if (
      typeof booking.service === "string" &&
      booking.service &&
      booking.service !== booking.serviceType &&
      !/^[a-f\d]{24}$/i.test(booking.service)
    ) {
      // Check if it's already a formatted string or just the type
      const lowerService = booking.service.toLowerCase();
      if (
        lowerService !== "replacement" &&
        lowerService !== "repair" &&
        lowerService !== "tinting"
      ) {
        return booking.service;
      }
    }

    return formatServiceType(booking.serviceType || booking.service);
  };

  const serviceName = formatServiceName();

  // Generate timeline if not present
  const generateTimeline = (status, timeline) => {
    // If timeline already exists, use it
    if (timeline && Array.isArray(timeline) && timeline.length > 0) {
      return timeline;
    }

    // Normalize status to lowercase for comparison
    const currentStatus = status?.toLowerCase() || "pending";

    // Determine if this booking came from a quote
    const isQuoteBased =
      booking.source === "QuoteAccepted" ||
      booking.quoteId ||
      booking.quoteRequestId ||
      booking.quote ||
      booking.quoteResponse;

    // Status progression levels based on specification
    const statusOrder = {
      quote: 0,
      pending: 1,
      searching: 1,
      accepted: 2,
      "awaiting-payment": 3,
      confirmed: 4,
      arrived: 5,
      "in-progress": 6,
      "completed-by-fitter": 7,
      completed: 8,
      cancelled: -1,
      expired: -1,
      rejected: -1,
    };

    const currentStatusLevel = statusOrder[currentStatus] || 1;

    // Check payment status
    const isPaid = (booking.paymentStatus || "").toLowerCase() === "paid";

    // Build timeline stages
    const stages = [];

    if (isQuoteBased) {
      // Quote-based booking timeline

      // 1. Quoted
      stages.push({
        status: "Quoted",
        date:
          (typeof booking.quote === "object" ? booking.quote?.createdAt : null) ||
          booking.quoteCreatedAt ||
          null,
        completed: true,
      });

      // 2. Provider Responded
      stages.push({
        status: "Provider Responded",
        date:
          (typeof booking.quoteResponse === "object" ? booking.quoteResponse?.createdAt : null) ||
          booking.quoteResponseCreatedAt ||
          null,
        completed: true,
      });

      // 3. Customer Accepted — booking was created at this point
      stages.push({
        status: "Customer Accepted",
        date: booking.createdAt || booking.acceptance?.acceptedAt,
        completed: true,
      });

      // 4. Payment Confirmed
      stages.push({
        status: "Payment Confirmed",
        date:
          booking.actualTimes?.confirmedAt ||
          booking.statusHistory?.find((h) => h.status === "confirmed")
            ?.timestamp,
        completed: isPaid,
      });

      // 5. Appointment Scheduled
      const hasSchedule = !!booking.scheduledDate;
      stages.push({
        status: "Appointment Scheduled",
        date: booking.actualTimes?.scheduledAt || (hasSchedule ? booking.scheduledDate : null),
        completed: hasSchedule,
      });

      // 6. Arrived at Location
      stages.push({
        status: "Arrived at Location",
        date: booking.actualTimes?.arrivedAt || null,
        completed: currentStatusLevel >= 5,
      });

      // 7. In Progress
      stages.push({
        status: "In Progress",
        date: booking.actualTimes?.startedAt || booking.startedAt,
        completed: currentStatusLevel >= 6,
      });

      // 8. Completed
      stages.push({
        status: "Completed",
        date: booking.actualTimes?.completedAt || booking.completedAt,
        completed: currentStatusLevel >= 7,
      });

      // Refund (Special Case)
      if (
        currentStatus === "cancelled" &&
        (booking.cancellation?.refundAmount > 0 ||
          booking.paymentStatus === "refunded")
      ) {
        stages.push({
          status: "Refund Processed",
          date: booking.cancellation?.refundedAt || booking.updatedAt,
          completed: true,
          isRefund: true,
        });
      }
    } else {
      // Direct booking timeline

      // 1. Searching / Initial Request
      stages.push({
        status: "Searching",
        date: booking.createdAt,
        completed: currentStatusLevel >= 1,
      });

      // 2. Accepted
      stages.push({
        status: "Accepted",
        date: booking.acceptance?.acceptedAt || booking.acceptedAt,
        completed: currentStatusLevel >= 2,
      });

      // 3. Awaiting Payment
      stages.push({
        status: "Awaiting Payment",
        date:
          booking.statusHistory?.find((h) => h.status === "awaiting-payment")
            ?.timestamp ||
          (currentStatusLevel >= 3
            ? booking.acceptance?.acceptedAt || booking.updatedAt
            : null),
        completed: currentStatusLevel >= 3 || isPaid,
      });

      // 4. Confirmed
      stages.push({
        status: "Confirmed",
        date: booking.actualTimes?.confirmedAt || booking.confirmedAt,
        completed: isPaid,
      });

      // 5. Arrived at Location
      stages.push({
        status: "Arrived at Location",
        date: booking.actualTimes?.arrivedAt || null,
        completed: currentStatusLevel >= 5,
      });

      // 6. In Progress
      stages.push({
        status: "In Progress",
        date: booking.actualTimes?.startedAt || booking.startedAt,
        completed: currentStatusLevel >= 6,
      });

      // 7. Completed
      stages.push({
        status: "Completed",
        date: booking.actualTimes?.completedAt || booking.completedAt,
        completed: currentStatusLevel >= 7,
      });

      // Refund (Special Case)
      if (
        currentStatus === "cancelled" &&
        (booking.cancellation?.refundAmount > 0 ||
          booking.paymentStatus === "refunded")
      ) {
        stages.push({
          status: "Refund Processed",
          date: booking.cancellation?.refundedAt || booking.updatedAt,
          completed: true,
          isRefund: true,
        });
      }
    }

    return stages;
  };

  // Normalize payment status
  const getNormalizedPaymentStatus = () => {
    if (!booking.paymentStatus) return "Unpaid";
    const ps = booking.paymentStatus.toLowerCase();
    if (ps === "partially_refunded") return "Partial Refund";
    return ps.charAt(0).toUpperCase() + ps.slice(1);
  };

  const normalizedPaymentStatus = getNormalizedPaymentStatus();

  // Format address
  let addressStr = "Location not specified";
  if (booking.serviceAddress) {
    if (typeof booking.serviceAddress === "string") {
      addressStr = booking.serviceAddress;
    } else {
      const { street, addressLine1, suburb, city, postalCode } =
        booking.serviceAddress;
      addressStr = [addressLine1 || street, suburb, city, postalCode]
        .filter(Boolean)
        .join(", ");
    }
  }

  // Format and process images with full URL
  const processImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    return images
      .map((img) => {
        if (!img) return null;
        if (typeof img !== "string") return img;
        if (img.startsWith("http") || img.startsWith("data:")) return img;
        // Prepend NodeURL if it's a relative path
        return `${NodeURL}${img.startsWith("/") ? "" : "/"}${img}`;
      })
      .filter(Boolean);
  };

  const damageImages = processImages([
    ...(booking.damageImages || []),
    ...(booking.completionDetails?.beforeImages || []),
    ...(booking.quote?.damageImages || []),
  ]);

  const afterImages = processImages(
    booking.completionDetails?.afterImages || [],
  );

  return {
    ...booking,
    id: booking._id || booking.id,
    reference:
      booking.bookingNumber ||
      booking.reference ||
      (booking._id || booking.id || "").substring(0, 8).toUpperCase(),
    vehicle: vehicleStr,
    vehicleRegNumber:
      (typeof booking.vehicle === "object" ? booking.vehicle?.registrationNumber : null) ||
      booking.vehicleRegNumber ||
      booking.registrationNumber ||
      "",
    vehicleData: {
      hasAdasCamera: booking.vehicle?.hasAdasCamera || false,
      hasRainSensor: booking.vehicle?.hasRainSensor || false,
    },
    service: serviceName,
    serviceTypes:
      booking.serviceTypes?.map(formatServiceType) ||
      (booking.serviceType ? [formatServiceType(booking.serviceType)] : []),
    glassType: formatGlassType(booking.glassType),
    glassTypes:
      booking.glassTypes?.map(formatGlassType) ||
      (booking.glassType ? [formatGlassType(booking.glassType)] : []),
    serviceSelections: booking.serviceSelections || [],
    address: addressStr,
    damageImages: damageImages, // Processed with full URLs
    afterImages: afterImages, // Processed with full URLs
    locationType:
      booking.serviceLocationType === "workshop"
        ? "Workshop"
        : "Mobile Service",
    statusLabel: formatBookingStatus(booking.status),
    paymentStatus: normalizedPaymentStatus,
    refundAmount: booking.cancellation?.refundAmount || 0,
    price: {
      service:
        (booking.priceBreakdown?.glassPrice || 0) +
          (booking.priceBreakdown?.laborPrice || 0) ||
        booking.price?.subtotal ||
        0,
      callout: booking.priceBreakdown?.calloutFee || 0,
      materials: booking.priceBreakdown?.materialsPrice || 0, // Fallback if exists
      vat: booking.price?.vat || 0,
      total: booking.price?.total || booking.totalAmount || 0,
    },
    providerName:
      booking.provider?.businessName ||
      booking.provider?.name ||
      booking.providerName ||
      (booking.status === "searching" ? "Searching..." : "AutoScreen Provider"),
    providerRating: booking.provider?.rating || 0,
    providerReviews:
      booking.provider?.reviewCount || booking.provider?.totalReviews || 0,
    providerPhone: booking.provider?.phone || booking.providerPhone,
    providerEmail: booking.provider?.email || booking.providerEmail,
    serviceLocationType: booking.serviceLocationType || booking.quote?.serviceLocation?.type || "mobile",
    workshopAddress: booking.provider?.serviceArea?.workshopAddress || null,
    estimatedDuration: booking.estimatedDuration || null,
    bookedDuration: booking.bookedDuration || null,
    suggestions: (booking.suggestions || []).map((s) => ({
      ...s,
      providerName: s.provider?.businessName || s.provider?.name || "Provider",
    })),
    // Use latest suggestion for display if available
    suggestedAlternateSlot:
      booking.suggestions?.length > 0
        ? booking.suggestions[booking.suggestions.length - 1].slot
        : booking.suggestedAlternateSlot,
    alternateSlotNote:
      booking.suggestions?.length > 0
        ? booking.suggestions[booking.suggestions.length - 1].note
        : booking.alternateSlotNote,
    timeline: generateTimeline(booking.status, booking.timeline),
    // Combined date and time for display (duration-aware for new bookings)
    formattedScheduledDateTime: (() => {
      const ts = booking.scheduledTimeSlot;
      const dur = booking.estimatedDuration;
      // Guard "00:00" slots — show date only
      if (ts === "00:00" || ts === "00:00 - 00:00") {
        return formatDateTime(booking.scheduledDate);
      }
      if (typeof ts === "object" && ts?.start === "00:00" && (!ts?.end || ts?.end === "00:00")) {
        return formatDateTime(booking.scheduledDate);
      }
      if (ts && typeof ts === "string" && !ts.includes("-") && !ts.includes("–") && dur && dur > 30) {
        const svcLocType = booking.serviceLocationType || booking.quote?.serviceLocation?.type || "mobile";
        const totalMin = booking.bookedDuration || (Math.ceil(dur / 30) * 30 + (svcLocType === "workshop" ? 30 : 0));
        const [h, m] = ts.split(":").map(Number);
        const endMins = (h || 0) * 60 + (m || 0) + totalMin;
        const endH = String(Math.floor(endMins / 60)).padStart(2, "0");
        const endM = String(endMins % 60).padStart(2, "0");
        return formatDateTime(booking.scheduledDate, `${ts} – ${endH}:${endM}`);
      }
      return formatDateTime(booking.scheduledDate, ts);
    })(),
    cancellation: booking.cancellation || null,
  };
};

/**
 * Map API quote data to frontend format
 */
export const mapQuote = (quote) => {
  if (!quote) return null;

  const vehicleStr =
    typeof quote.vehicle === "string"
      ? quote.vehicle
      : quote.vehicle
        ? `${quote.vehicle.year || ""} ${quote.vehicle.make || ""} ${
            quote.vehicle.model || ""
          }`.trim()
        : "Unknown Vehicle";

  // Format and process images with full URL
  const processImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    return images
      .map((img) => {
        if (!img) return null;
        if (typeof img !== "string") return img;
        if (img.startsWith("http") || img.startsWith("data:")) return img;
        return `${NodeURL}${img.startsWith("/") ? "" : "/"}${img}`;
      })
      .filter(Boolean);
  };

  // Normalize backend status to frontend display status
  const normalizeStatus = (backendStatus, responseCount = 0) => {
    const status = backendStatus?.toLowerCase() || "pending";

    switch (status) {
      case "pending":
        // If there are responses, it should be "Responses", otherwise "Open"
        return responseCount > 0 ? "Responses" : "Open";
      case "quoted":
        return "Responses";
      case "accepting":
      case "accepted":
        return "Accepted";
      case "closed":
      case "expired":
      case "cancelled":
        return "Closed";
      default:
        // Handle already normalized values or unknown
        if (
          ["Open", "Responses", "Accepted", "Closed"].includes(backendStatus)
        ) {
          return backendStatus;
        }
        return "Open";
    }
  };

  const responsesCount = quote.responseCount || quote.responses?.length || quote.responsesCount || 0;
  const providerCount = quote.broadcastedTo?.length || quote.providerCount || 0;

  return {
    ...quote,
    id: quote._id || quote.id,
    reference:
      quote.quoteNumber ||
      (quote._id || quote.id || "").substring(0, 8).toUpperCase(),
    vehicleFormatted: vehicleStr,
    vehicleData: {
      hasAdasCamera: quote.vehicle?.hasAdasCamera || false,
      hasRainSensor: quote.vehicle?.hasRainSensor || false,
    },
    serviceType: formatServiceType(quote.serviceType),
    serviceTypes:
      quote.serviceTypes?.map(formatServiceType) ||
      (quote.serviceType ? [formatServiceType(quote.serviceType)] : []),
    glassType: formatGlassType(quote.glassType),
    glassTypes:
      quote.glassTypes?.map(formatGlassType) ||
      (quote.glassType ? [formatGlassType(quote.glassType)] : []),
    serviceSelections: quote.serviceSelections || [],
    location: quote.serviceLocation?.address || { city: "N/A" },
    responsesCount: responsesCount,
    providerCount: providerCount,
    images: processImages(quote.damageImages || quote.images || []),
    status: (() => {
      const computed = normalizeStatus(quote.status, responsesCount);
      return computed;
    })(),
    rawStatus: quote.status, // Keep original for debugging
  };
};

/**
 * Map API user data to frontend format
 */
export const mapUser = (user) => {
  if (!user) return null;

  // Map vehicles with proper format
  const vehicles = (user.vehicles || []).map((v, index) => ({
    id: v._id || v.id || `VEH-${index}`,
    make: v.make,
    model: v.model,
    year: v.year,
    registrationNumber: v.registrationNumber || "",
    isDefault: v.isDefault || index === 0,
  }));

  // Map addresses with coordinates
  const addresses = (user.addresses || []).map((a, index) => ({
    id: a._id || a.id || `ADDR-${index}`,
    label: a.label || "Home",
    line1: a.addressLine1 || a.line1 || "",
    suburb: a.suburb || "",
    city: a.city || "",
    postcode: a.postalCode || a.postcode || "",
    coordinates: a.coordinates || null,
    isDefault: a.isDefault || index === 0,
  }));

  return {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    avatar: user.profileImage
      ? user.profileImage.startsWith("http")
        ? user.profileImage
        : `${NodeURL}${user.profileImage}`
      : user.avatar || null, // Map profileImage to avatar with full URL
    preferredContact: user.preferredContact || "whatsapp",
    memberSince: user.createdAt || new Date(),
    isVerified: user.isVerified || false,
    membershipTier: user.membershipTier || "Basic",
    notificationPreferences: user.notificationPreferences || {
      email: true,
      sms: false,
      whatsapp: true,
    },
    vehicles,
    addresses,
  };
};
