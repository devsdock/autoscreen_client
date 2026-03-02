import { request } from "./api";

/**
 * Payment Service
 * Endpoints: /customer/payments/...
 * Supports Paystack secure checkout and split payments
 */
const paymentService = {
  getPaystackConfig: () => {
    return request({
      method: "GET",
      url: "/customer/payments/config-paystack",
    });
  },

  /**
   * Get all payments (history + pending)
   * Includes Paystack transactions and legacy payments
   *
   * @param params Query parameters (status, search)
   */
  getMyPayments: (params = {}) => {
    const { status, search } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);
    if (search) queryParams.append("search", search);

    return request({
      method: "GET",
      url: `/customer/payments?${queryParams.toString()}`,
    });
  },

  /**
   * Get payment details by booking ID
   */
  getPaymentByBooking: (bookingId) => {
    return request({
      method: "GET",
      url: `/customer/payments/${bookingId}`,
    });
  },

  /**
   * Initialize Paystack Payment
   * @param {string} bookingId
   * @returns {Object} { success, authorization_url, reference }
   */
  initializePaystack: (bookingId, coversFees = false) => {
    return request({
      method: "POST",
      url: "/customer/payments/initialize-paystack",
      data: { bookingId, coversFees },
    });
  },

  /**
   * Verify Paystack Payment
   * @param {string} reference
   */
  verifyPaystack: (reference) => {
    return request({
      method: "GET",
      url: `/customer/payments/verify-paystack/${reference}`,
    });
  },
};

export default paymentService;
