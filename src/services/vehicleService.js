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
    if (make === "Other") return ["Other"];

    try {
      const response = await axios.get(
        `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${make}?format=json`,
      );

      if (response.data && response.data.Results) {
        // Map and sort models
        const models = response.data.Results.map((item) => item.Model_Name)
          .filter(
            (value, index, self) => value && self.indexOf(value) === index,
          ) // Unique
          .sort();
        return [...models, "Other"];
      }
      return ["Other"];
    } catch (error) {
      return ["Other"];
    }
  },

  /**
   * Get all vehicle makes (optional, if we want to dynamic makes too)
   */
  getAllMakes: async () => {
    try {
      const response = await axios.get(
        "https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json",
      );

      if (response.data && response.data.Results) {
        const makes = response.data.Results.map((item) => item.MakeName).sort();
        // Ensure "Other" is at the end and common makes are present if needed
        // Jeep might be missing from 'car' type if it's classified as 'truck' or 'multipurpose passenger vehicle'
        // So we might want to fetch those too or just ensure common ones are there.
        if (!makes.includes("Jeep")) makes.push("Jeep");
        return [...makes.sort(), "Other"];
      }
      return ["Other"];
    } catch (error) {
      return ["Other"];
    }
  },
};

export default vehicleService;
