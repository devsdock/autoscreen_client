import { NodeURL } from "../services/api";

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

  // Format service name from serviceType and glassType
  const formatServiceName = () => {
    // If service object exists with a name
    if (typeof booking.service === "object" && booking.service?.name) {
      return booking.service.name;
    }
    if (typeof booking.service === "string" && booking.service) {
      return booking.service;
    }

    // Build from serviceType and glassType
    const serviceType = booking.serviceType || "";
    const glassType = booking.glassType || "windscreen";

    // Capitalize and format
    const glassName =
      glassType.charAt(0).toUpperCase() + glassType.slice(1).replace(/-/g, " ");
    const typeName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);

    if (serviceType && glassType) {
      return `${glassName} ${typeName}`;
    }
    if (serviceType) {
      return `Windscreen ${typeName}`;
    }

    return "Auto Glass Service";
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
      quote: 0, // Initial quote acceptance (quote-based only)
      pending: 1, // Alternative starting point
      searching: 1, // Request sent to providers
      accepted: 2, // Provider accepted the job
      "awaiting-payment": 3, // User must complete payment
      confirmed: 4, // Payment completed
      "in-progress": 5, // Job ongoing
      completed: 6, // Job finished
      cancelled: -1, // Cancelled by user/provider
      expired: -1,
      rejected: -1,
    };

    const currentStatusLevel = statusOrder[currentStatus] || 1;

    // Check payment status
    const isPaid = (booking.paymentStatus || "").toLowerCase() === "paid";

    // Build timeline stages based on booking source
    const stages = [];

    // 1. Quote Accepted (only for quote-based bookings)
    if (isQuoteBased) {
      stages.push({
        status: "Quote Accepted",
        date: booking.quoteAcceptedAt || booking.createdAt,
        completed: currentStatusLevel >= 0,
      });
    }

    // 2. Searching (Request sent to providers) - ONLY for direct bookings
    if (!isQuoteBased) {
      stages.push({
        status: "Searching",
        date:
          booking.searchStartedAt ||
          booking.createdAt ||
          new Date().toISOString(),
        completed: currentStatusLevel >= 1,
      });
    }

    // 3. Accepted (Provider accepted the job)
    stages.push({
      status: "Accepted",
      date:
        currentStatusLevel >= 2
          ? booking.acceptedAt ||
            booking.acceptance?.acceptedAt ||
            booking.providerAcceptedAt
          : null,
      completed: currentStatusLevel >= 2,
    });

    // 4. Awaiting Payment (User must complete payment)
    const awaitingPaymentCompleted = isPaid; // Only completed if actually paid
    stages.push({
      status: "Awaiting Payment",
      date:
        awaitingPaymentCompleted || currentStatusLevel >= 3
          ? booking.paymentRequestedAt || booking.acceptedAt
          : null,
      completed: awaitingPaymentCompleted,
    });

    // 5. Confirmed (Payment completed)
    // Only completed if status is high enough AND paid
    const confirmedCompleted = currentStatusLevel >= 4 && isPaid;
    stages.push({
      status: "Confirmed",
      date: confirmedCompleted ? booking.confirmedAt || booking.paidAt : null,
      completed: confirmedCompleted,
    });

    // 6. In Progress (Job ongoing)
    stages.push({
      status: "In Progress",
      date:
        currentStatusLevel >= 5
          ? booking.startedAt || booking.inProgressAt
          : null,
      completed: currentStatusLevel >= 5,
    });

    // 7. Completed (Job finished)
    stages.push({
      status: "Completed",
      date:
        currentStatusLevel >= 6
          ? booking.completedAt || booking.finishedAt
          : null,
      completed: currentStatusLevel >= 6,
    });

    return stages;
  };

  // Normalize payment status
  const normalizedPaymentStatus = booking.paymentStatus
    ? booking.paymentStatus.charAt(0).toUpperCase() +
      booking.paymentStatus.slice(1).toLowerCase()
    : "Unpaid";

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
    booking.completionDetails?.afterImages || []
  );

  return {
    ...booking,
    id: booking._id || booking.id,
    reference:
      booking.bookingNumber ||
      booking.reference ||
      (booking._id || booking.id || "").substring(0, 8).toUpperCase(),
    vehicle: vehicleStr,
    service: serviceName,
    address: addressStr,
    damageImages: damageImages, // Processed with full URLs
    afterImages: afterImages, // Processed with full URLs
    locationType:
      booking.serviceLocationType === "shop" ||
      booking.serviceLocationType === "workshop"
        ? "In-Store"
        : "Mobile Service",
    paymentStatus: normalizedPaymentStatus,
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
    timeline: generateTimeline(booking.status, booking.timeline),
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
      case "accepted":
        return "Accepted";
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

  const responsesCount = quote.responseCount || quote.responses?.length || 0;

  return {
    ...quote,
    id: quote._id || quote.id,
    reference:
      quote.quoteNumber ||
      (quote._id || quote.id || "").substring(0, 8).toUpperCase(),
    vehicleFormatted: vehicleStr,
    serviceType: quote.serviceType || "Glass Replacement",
    location: quote.serviceLocation?.address || { city: "N/A" },
    responsesCount: responsesCount,
    images: processImages(quote.damageImages || quote.images || []),
    status: normalizeStatus(quote.status, responsesCount),
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
