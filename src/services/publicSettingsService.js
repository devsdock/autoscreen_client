import request from "./api";

/**
 * Fetch public platform settings (glass types, cities)
 */
export const getPublicSettings = async () => {
  try {
    const response = await request({
      method: "GET",
      url: "/public/settings",
    });

    const data = response.data || {};
    let fetchedServices = data.serviceTypes || [];

    // GLOBAL PATCH: ensure "Glass Repair" has all glass types
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

      fetchedServices[repairServiceIndex] = {
        ...repairService,
        pricing: newRepairPricing,
      };

      data.serviceTypes = fetchedServices;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch public settings:", error);
    // Return fallback defaults if API fails
    return {
      serviceAreas: [
        "Johannesburg",
        "Pretoria",
        "Cape Town",
        "Durban",
        "Port Elizabeth",
      ],
      glassTypes: [
        "Windscreen",
        "Side Window (Front Left)",
        "Side Window (Front Right)",
        "Side Window (Rear Left)",
        "Side Window (Rear Right)",
        "Rear Window",
        "Door Glass",
        "Quarter Glass",
        "Sunroof",
      ],
      serviceTypes: [
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
      ],
      supportEmail: "support@autoscreen.co.za",
      supportPhone: "078 965 9317",
      supportWhatsApp: "078 965 9317",
    };
  }
};

/**
 * Fetch platform commission percentage
 */
export const getCommission = async () => {
  try {
    const response = await request({
      method: "GET",
      url: "/public/settings/commission",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch commission settings:", error);
    // Return fallback default if API fails
    return {
      percentage: 10,
      type: "percentage",
    };
  }
};

/**
 * Fetch cancellation policy (for payment modal display)
 */
export const getCancellationPolicy = async () => {
  try {
    const response = await request({
      method: "GET",
      url: "/public/settings/cancellation-policy",
    });
    return response.data || {};
  } catch (error) {
    console.error("Failed to fetch cancellation policy:", error);
    return {
      policyText:
        "Your payment is held securely. It's only released to the provider once your service is completed to your satisfaction. Fully refundable up to 24 hours before your appointment.",
    };
  }
};

/**
 * Fetch partial-payment configuration (Points 1-2, April 2026)
 * Returns { isActive, depositPercentage, balancePercentage }.
 */
export const getPartialPaymentConfig = async () => {
  try {
    const response = await request({
      method: "GET",
      url: "/public/settings/partial-payment",
    });
    return response.data || { isActive: false, depositPercentage: 100, balancePercentage: 0 };
  } catch (error) {
    console.error("Failed to fetch partial-payment config:", error);
    return { isActive: false, depositPercentage: 100, balancePercentage: 0 };
  }
};

export default {
  getPublicSettings,
  getCommission,
  getCancellationPolicy,
  getPartialPaymentConfig,
};
