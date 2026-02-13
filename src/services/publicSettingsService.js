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
    return response.data;
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
        "Quarter Glass",
        "Sunroof",
      ],
      serviceTypes: [
        {
          name: "Glass Replacement",
          description: "Full glass replacement",
        },
        {
          name: "Glass Repair",
          description: "Chip and crack repair",
        },
        {
          name: "Anti-Smash and Grab Film",
          description: "Anti-Smash and Grab Film application",
        },
      ],
      supportEmail: "support@autoscreen.co.za",
      supportPhone: "+27 71 046 1517",
      supportWhatsApp: "+27 71 046 1517",
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

export default {
  getPublicSettings,
  getCommission,
};
