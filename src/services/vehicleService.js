import axios from "axios";
import { vehicleMakes, commonSAModels } from "../data/vehicles";

/**
 * Vehicle Service using NHTSA Public API
 * https://vpic.nhtsa.dot.gov/api/
 */
const vehicleService = {
  /**
   * Get all models for a specific make
   * @param {string} make - Vehicle make (e.g., 'Toyota', 'BMW')
   */
  getModelsByMake: async (make) => {
    if (!make) return [];

    // Check local common models first (for SA brands not in US API)
    if (commonSAModels[make]) {
      return [...commonSAModels[make].sort()];
    }

    try {
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${make}?format=json`,
      );

      if (
        response.data &&
        response.data.Results &&
        response.data.Results.length > 0
      ) {
        // Map and sort models
        const models = response.data.Results.map((item) => item.Model_Name)
          .filter(
            (value, index, self) => value && self.indexOf(value) === index,
          ) // Unique
          .sort();
        return models;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Get all vehicle makes (optional, if we want to dynamic makes too)
   */
  getAllMakes: async () => {
    // Start with our comprehensive local list
    let makes = [...vehicleMakes];

    try {
      const response = await axios.get(
        "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json",
      );

      if (response.data && response.data.Results) {
        const apiMakes = response.data.Results.map((item) => {
          // Convert generic UPPERCASE to Title Case
          return item.MakeName.toLowerCase().replace(/\b\w/g, (s) =>
            s.toUpperCase(),
          );
        });

        // Merge and deduplicate
        const uniqueMakes = new Set([...makes, ...apiMakes]);
        makes = Array.from(uniqueMakes).sort();
      }
    } catch (error) {
      console.error(
        "Failed to fetch makes, falling back to local list:",
        error,
      );
      // Fallback is already set to local list
    }

    return makes;
  },
};

export default vehicleService;
