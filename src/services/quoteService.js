import { request } from "./api";

/**
 * Quote Service
 */
const quoteService = {
  /**
   * Create a new quote request
   */
  createQuote: (data) => {
    return request({
      method: "POST",
      url: "/api/customer/quotes",
      data,
    });
  },

  /**
   * Get all quotes for customer
   */
  getQuotes: (params = {}) => {
    const { status, page = 1, limit = 10 } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    return request({
      method: "GET",
      url: `/api/customer/quotes?${queryParams.toString()}`,
    });
  },

  /**
   * Get single quote with responses
   */
  getQuote: (quoteId) => {
    return request({
      method: "GET",
      url: `/api/customer/quotes/${quoteId}`,
    });
  },

  /**
   * Get quote responses from providers
   */
  getQuoteResponses: (quoteId) => {
    return request({
      method: "GET",
      url: `/api/customer/quotes/${quoteId}/responses`,
    });
  },

  /**
   * Accept a quote response and create booking
   */
  acceptQuoteResponse: (quoteId, responseId, data = {}) => {
    return request({
      method: "POST",
      url: `/api/customer/quotes/${quoteId}/accept/${responseId}`,
      data,
    });
  },

  /**
   * Cancel a quote
   */
  cancelQuote: (quoteId) => {
    return request({
      method: "PUT",
      url: `/api/customer/quotes/${quoteId}/cancel`,
    });
  },
};

export default quoteService;
