import { request } from "./api";

/**
 * Vehicle Service — Database-backed vehicle make/model lookup
 * Endpoints: /public/vehicles/...
 */
const vehicleService = {
  /**
   * Get all active vehicle makes, sorted A-Z
   * @param {string} [search] - Optional search filter
   * @returns {Promise<Array>} Array of { _id, name, isCustom }
   */
  getAllMakes: async (search) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await request({
      method: "GET",
      url: `/public/vehicles${params}`,
    });
    return response.data?.data || response.data || [];
  },

  /**
   * Get all active models for a make
   * @param {string} makeIdOrName - Make ObjectId or name
   * @returns {Promise<Array>} Array of { _id, name, isCustom }
   */
  getModelsByMake: async (makeIdOrName) => {
    if (!makeIdOrName) return [];
    const response = await request({
      method: "GET",
      url: `/public/vehicles/${encodeURIComponent(makeIdOrName)}/models`,
    });
    return response.data?.data || response.data || [];
  },

  /**
   * Create a custom vehicle make (idempotent)
   * @param {string} name - Make name
   * @returns {Promise<Object>} Created or existing make { _id, name }
   */
  createMake: async (name) => {
    const response = await request({
      method: "POST",
      url: "/public/vehicles",
      data: { name },
    });
    return response.data?.data || response.data;
  },

  /**
   * Create a custom vehicle model under a make (idempotent)
   * @param {string} makeId - Make ObjectId or name
   * @param {string} name - Model name
   * @returns {Promise<Object>} Created or existing model { _id, name }
   */
  createModel: async (makeId, name) => {
    const response = await request({
      method: "POST",
      url: `/public/vehicles/${encodeURIComponent(makeId)}/models`,
      data: { name },
    });
    return response.data?.data || response.data;
  },
};

export default vehicleService;
