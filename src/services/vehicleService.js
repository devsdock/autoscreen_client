import axios from "axios";

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

    try {
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${make}?format=json`
      );

      if (response.data && response.data.Results) {
        // Map and sort models
        return response.data.Results.map((item) => item.Model_Name)
          .filter((value, index, self) => self.indexOf(value) === index) // Unique
          .sort();
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
    try {
      const response = await axios.get(
        "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json"
      );

      if (response.data && response.data.Results) {
        return response.data.Results.map((item) => item.MakeName).sort();
      }
      return [];
    } catch (error) {
      return [];
    }
  },
};

export default vehicleService;
