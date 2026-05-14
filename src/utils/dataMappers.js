import { NodeURL } from "../services/api";
import { formatDate, formatDateTime, formatTimeSlot } from "./dateUtils";

// Helper functions for formatting

/**
 * Formats a customer-selected glass quality tier value (the DB enum
 * "OEM" | "OEE" | "aftermarket") into a customer-facing label.
 *
 *   formatGlassQuality("aftermarket")              → "Generic"
 *   formatGlassQuality("OEM")                       → "OEM"
 *   formatGlassQuality("OEM", { suffix: "Glass" }) → "OEM Glass"
 *   formatGlassQuality(null)                        → null  (caller skips render)
 *
 * Centralised so the "aftermarket → Generic" flip lives in one place
 * across BookingCard, BookingDetailDrawer, QuoteDetailPanel, etc.
 */
export const formatGlassQuality = (quality, { suffix = "" } = {}) => {
  if (!quality) return null;
  const base = quality === "aftermarket" ? "Generic" : quality;
  return suffix ? `${base} ${suffix}` : base;
};

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

    // Workshop bookings: customer arrives at the provider's workshop, so the
    // "arrived" step reads as "Customer Arrived". Mobile keeps existing copy.
    const svcMode = booking.serviceLocationType || booking.quote?.serviceLocation?.type || "mobile";
    const arrivedLabel = svcMode === "workshop" ? "Customer Arrived" : "Arrived at Location";

    // Determine if this booking came from a quote
    const isQuoteBased =
      booking.source === "QuoteAccepted" ||
      booking.quoteId ||
      booking.quoteRequestId ||
      booking.quote ||
      booking.quoteResponse;

    // Status progression levels based on specification
    // Flexible Payment Options v1.2 — `service-done` and `payment-pending`
    // are post-payment-model statuses that fit between "in-progress" and
    // "completed". They share level 7 with `completed-by-fitter` so the
    // existing `currentStatusLevel >= 7` checks still mark all earlier
    // stages as complete.
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
      "service-done": 7,
      "payment-pending": 7,
      completed: 8,
      cancelled: -1,
      expired: -1,
      rejected: -1,
    };

    const currentStatusLevel = statusOrder[currentStatus] || 1;

    // Check payment status
    const pStat = (booking.paymentStatus || "").toLowerCase();
    const isPaid = pStat === "paid" || pStat === "insurance_direct";

    // Build timeline stages
    const stages = [];

    // Flexible Payment Options v1.2 — derive payment model so the timeline
    // can show the correct sequence (cash + card-on-completion have no
    // Paystack-up-front step, and add a "Service Done" step before final).
    const paymentOption = booking.paymentOption || "prepayment";
    const isCash = paymentOption === "cash";
    const isCardAfter = paymentOption === "card_on_completion";
    const isPostPayment = isCash || isCardAfter;
    const hasCashReceipt = !!booking.cashReceipt?.confirmedAt;
    const hasPaymentLink = !!booking.paymentLink?.sentAt;
    const isServiceDone =
      currentStatus === "service-done" ||
      currentStatus === "payment-pending" ||
      currentStatus === "completed";
    const isPaymentPending = currentStatus === "payment-pending";

    // Partial Payment (Points 1-2, April 2026) — deposit % charged at acceptance,
    // balance % collected at service-done. Drives 2 timeline events:
    //   step 4: "Deposit Paid R{amount} ({pct}%)" replaces the standard
    //           acceptance-time payment step
    //   step 8.5: "Balance Paid R{amount} ({pct}%) via {method}" inserted
    //           between Service Done and Completed when balanceStatus is "paid"
    //
    // IMPORTANT — strict gate: legacy non-partial bookings (cash + card-after
    // pre-April 2026) have no upfront payment but also have no
    // `partialPayment` subdoc OR have `isActive: false`. Both the deposit
    // step replacement AND the balance step insertion must require BOTH
    // `partialPayment.isActive === true` AND `depositAmount > 0` so a
    // half-populated record can never accidentally trigger partial UI.
    const _depositAmtRaw = Number(booking.depositAmount) || 0;
    const _balanceAmtRaw = Number(booking.balanceAmount) || 0;
    const isPartial =
      booking.partialPayment?.isActive === true && _depositAmtRaw > 0;
    const depositPct = booking.partialPayment?.depositPercentage || 0;
    const balancePct = booking.partialPayment?.balancePercentage || 0;
    const depositAmt = _depositAmtRaw;
    const balanceAmt = _balanceAmtRaw;
    const balancePaid = isPartial && booking.balanceStatus === "paid";
    // Resolve balance method — "card" branch further distinguishes between
    // auto-charge (saved card / tokenized) and link-based (Path B Pay-via-link)
    // so the timeline copy matches what the customer actually experienced.
    const _resolveBalanceMethodLabel = () => {
      const m = booking.balancePaymentMethod;
      if (m === "cash") return "Cash";
      if (m === "eft") return "EFT";
      if (m === "speed_point") return "Speed Point";
      if (m === "card") {
        if (booking.paymentSubMethod === "tokenized") return "Card (Auto-charge)";
        if (booking.paymentSubMethod === "payment_link") return "Card (Pay Link)";
        return "Card";
      }
      return "Card";
    };
    const balanceMethodLabel = _resolveBalanceMethodLabel();
    const formatZAR = (n) => `R ${Number(n).toLocaleString("en-US")}`;

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

      // 4. Payment-model-specific confirmation step.
      // Partial bookings (any acceptMode) show "Deposit Paid R{amount} ({pct}%)"
      // — clearer than mode-specific labels because partial flow always charges
      // a deposit at acceptance regardless of how the balance is collected.
      if (isPartial) {
        stages.push({
          status: `Deposit Paid ${formatZAR(depositAmt)} (${depositPct}%)`,
          date:
            booking.actualTimes?.confirmedAt ||
            booking.partialPayment?.snapshotAt ||
            booking.createdAt,
          completed: true,
        });
      } else if (isCash) {
        // Cash: no Paystack at acceptance — booking is immediately confirmed
        stages.push({
          status: "Cash Booking Confirmed",
          date: booking.actualTimes?.confirmedAt || booking.createdAt,
          completed: true,
        });
      } else if (isCardAfter) {
        // Card on Completion: Path A saves a card via R1 tokenize +
        // immediate refund; Path B has no Paystack step until after service.
        stages.push({
          status: booking.cardAuth?.last4
            ? `Card Saved (••${booking.cardAuth.last4})`
            : "Pay After Confirmed",
          date: booking.actualTimes?.confirmedAt || booking.createdAt,
          completed: true,
        });
      } else {
        // Prepayment — original Paystack settlement step
        stages.push({
          status: "Payment Confirmed",
          date:
            booking.actualTimes?.confirmedAt ||
            booking.statusHistory?.find((h) => h.status === "confirmed")
              ?.timestamp,
          completed: isPaid,
        });
      }

      // 5. Appointment Scheduled
      const hasSchedule = !!booking.scheduledDate;
      stages.push({
        status: "Appointment Scheduled",
        date: booking.actualTimes?.scheduledAt || (hasSchedule ? booking.scheduledDate : null),
        completed: hasSchedule,
      });

      // 6. Arrived at Location
      stages.push({
        status: arrivedLabel,
        date: booking.actualTimes?.arrivedAt || null,
        completed: currentStatusLevel >= 5,
      });

      // 7. In Progress
      stages.push({
        status: "In Progress",
        date: booking.actualTimes?.startedAt || booking.startedAt,
        completed: currentStatusLevel >= 6,
      });

      // 8. Service Done — only for post-payment models (cash + card-after).
      // For prepayment this step is collapsed into "Completed".
      if (isPostPayment) {
        stages.push({
          status: "Service Done",
          date:
            booking.statusHistory?.find((h) => h.status === "service-done")
              ?.timestamp || null,
          completed: isServiceDone,
        });
      }

      // 9. Path B specific — payment link sent, awaiting customer payment
      if (isCardAfter && (isPaymentPending || hasPaymentLink)) {
        stages.push({
          status: "Awaiting Customer Payment",
          date: booking.paymentLink?.sentAt || null,
          completed: isPaid,
        });
      }

      // 9.5. Balance Paid — partial bookings only, when balance leg has
      // settled (cash collected, link paid, or auto-charge succeeded).
      // Inserted between Service Done and Completed.
      if (isPartial && balancePaid) {
        stages.push({
          status: `Balance Paid ${formatZAR(balanceAmt)} (${balancePct}%) via ${balanceMethodLabel}`,
          date: booking.balancePaidAt || null,
          completed: true,
        });
      }

      // 10. Completed
      stages.push({
        status: "Completed",
        date: booking.actualTimes?.completedAt || booking.completedAt,
        completed: currentStatus === "completed",
      });

      // Refund (Special Case) — cash bookings have no refund (provider keeps
      // the cash directly); only show for prepayment + card-after.
      if (
        currentStatus === "cancelled" &&
        !isCash &&
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
        status: arrivedLabel,
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
    if (ps === "insurance_direct") return "Paid";
    if (ps === "partially_refunded") return "Partial Refund";
    // Partial Payment (Points 1-2): deposit_paid renders as "Deposit Paid" pill
    if (ps === "deposit_paid") return "Deposit Paid";
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
        : "Mobile",
    statusLabel: formatBookingStatus(booking.status),
    paymentStatus: normalizedPaymentStatus,
    paymentOption: booking.paymentOption || "prepayment",
    paymentSubMethod: booking.paymentSubMethod || null,
    cashReceipt: booking.cashReceipt || null,
    paymentLink: booking.paymentLink || null,
    cardAuth: booking.cardAuth || null,
    // Partial Payment fields (Points 1-2, April 2026)
    partialPayment: booking.partialPayment || null,
    depositAmount: booking.depositAmount ?? null,
    balanceAmount: booking.balanceAmount ?? null,
    balanceStatus: booking.balanceStatus || null,
    balancePaymentMethod: booking.balancePaymentMethod || null,
    balancePaidAt: booking.balancePaidAt || null,
    refundAmount: booking.cancellation?.refundAmount || 0,
    price: {
      service:
        (booking.priceBreakdown?.glassPrice || 0) +
          (booking.priceBreakdown?.laborPrice || 0) ||
        booking.price?.subtotal ||
        0,
      subtotal: booking.price?.subtotal || 0,
      callout: booking.priceBreakdown?.calloutFee || 0,
      materials: booking.priceBreakdown?.materialsPrice || 0, // Fallback if exists
      vat: booking.price?.vat || 0,
      vatPercentage: booking.price?.vatPercentage || 0,
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
    providerBusinessType: booking.provider?.businessType || null,
    providerVatNumber: booking.provider?.vatNumber || null,
    providerInsuranceApproved: booking.provider?.insurancePartnerships?.some(p => p.isActive) || false,
    isInsuranceClaim: booking.isInsuranceClaim || false,
    insuranceDetails: booking.insuranceDetails || null,
    serviceLocationType: booking.serviceLocationType || booking.quote?.serviceLocation?.type || "mobile",
    workshopAddress: booking.provider?.serviceArea?.workshopAddress || null,
    estimatedDuration: booking.estimatedDuration || null,
    bookedDuration: booking.bookedDuration || null,
    assignedStaff: booking.assignedStaff || null,
    assignedStaffName: booking.assignedStaff?.firstName
      ? `${booking.assignedStaff.firstName} ${booking.assignedStaff.lastName || ""}`.trim()
      : null,
    assignedStaffPhone: booking.assignedStaff?.phone || null,
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
  // Temporary response cap per quote — display "X of min(3, broadcasted)".
  const MAX_VISIBLE_PROVIDERS = 3;
  const broadcastedCount = quote.broadcastedTo?.length || quote.providerCount || 0;
  const providerCount = Math.min(MAX_VISIBLE_PROVIDERS, broadcastedCount);

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
    insurance: user.insurance || null,
  };
};
