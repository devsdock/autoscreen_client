import { request } from "./api";

/**
 * Quote Service
 * Endpoints: /customer/quotes/...
 */
const quoteService = {
  /**
   * Create a new quote request
   */
  createQuote: (data) => {
    return request({
      method: "POST",
      url: "/customer/quotes",
      data,
    });
  },

  /**
   * Upload damage images
   */
  uploadDamageImages: (formData) => {
    return request({
      method: "POST",
      url: "/customer/quotes/upload-images",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Get all quotes for customer
   * @param {Object} params - { status, group, page, limit }
   *   group: "active" | "completed" | "closed" — backend shortcut
   */
  getQuotes: (params = {}) => {
    const { status, group, page = 1, limit = 50 } = params;
    const queryParams = new URLSearchParams();
    if (group) queryParams.append("group", group);
    else if (status) queryParams.append("status", status);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    return request({
      method: "GET",
      url: `/customer/quotes?${queryParams.toString()}`,
    });
  },

  /**
   * Get single quote with responses
   */
  getQuote: (quoteId) => {
    return request({
      method: "GET",
      url: `/customer/quotes/${quoteId}`,
    });
  },

  /**
   * Get quote responses from providers
   */
  getQuoteResponses: (quoteId) => {
    return request({
      method: "GET",
      url: `/customer/quotes/${quoteId}/responses`,
    });
  },

  /**
   * Cancel a quote
   */
  cancelQuote: (quoteId) => {
    return request({
      method: "PUT",
      url: `/customer/quotes/${quoteId}/cancel`,
    });
  },

  /**
   * Get provider availability for a specific date
   */
  getProviderAvailability: (providerId, date) => {
    return request({
      method: "GET",
      url: `/customer/quotes/providers/${providerId}/availability?date=${date}`,
    });
  },

  getProviderBlockedDates: (providerId) => {
    return request({
      method: "GET",
      url: `/customer/quotes/providers/${providerId}/blocked-dates`,
    });
  },
};

export default quoteService;
