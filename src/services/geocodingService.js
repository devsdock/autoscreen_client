import axios from "axios";
import { CITY_COORDINATES } from "../data/cities";

// Using OpenStreetMap Nominatim API (Free, requires User-Agent)
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

const geocodingService = {
  /**
   * Get coordinates for a given address string
   * @param {string} address - The full address to search (e.g. "123 Main St, Sandton, Johannesburg")
   * @returns {Promise<{lat: number, lng: number} | null>}
   */
  getCoordinates: async (address) => {
    try {
      if (!address) return null;

      // 1. Try Local Lookup First (Fast & Reliable)
      const addressLower = address.toLowerCase();

      // Find longest matching city name (to prefer "Johannesburg North" over "Johannesburg")
      const cityKeys = Object.keys(CITY_COORDINATES).sort(
        (a, b) => b.length - a.length
      );

      for (const city of cityKeys) {
        if (addressLower.includes(city.toLowerCase())) {
          return CITY_COORDINATES[city];
        }
      }

      // 2. Fallback to API (Nominatim)
      const response = await axios.get(NOMINATIM_BASE_URL, {
        params: {
          q: address,
          format: "json",
          limit: 1,
          countrycodes: "za", // Limit to South Africa
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];

        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
      } else {
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Get current device location
   * @returns {Promise<{lat: number, lng: number}>}
   */
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  },
};

export default geocodingService;
