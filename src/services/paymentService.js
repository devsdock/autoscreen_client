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
   * @param {Object} params - { bookingId } for direct bookings, or { quoteId, responseId } for quote flow
   * @param {boolean} coversFees
   * @returns {Object} { success, authorization_url, reference }
   */
  initializePaystack: (params, coversFees = false) => {
    // Backward compat: if params is a string, treat as bookingId
    const data = typeof params === "string"
      ? { bookingId: params, coversFees }
      : { ...params, coversFees };
    return request({
      method: "POST",
      url: "/customer/payments/initialize-paystack",
      data,
    });
  },

  /**
   * Accept a quote with Cash on Completion payment option (PRD v1.2 — Model B).
   * Creates a confirmed booking without any Paystack transaction. Customer pays
   * the provider in cash at service time.
   *
   * @param {Object} params - { quoteId, responseId }
   * @returns {Object} { success, bookingId, bookingNumber, redirect_url }
   */
  acceptCash: ({ quoteId, responseId }) => {
    return request({
      method: "POST",
      url: "/customer/payments/accept-cash",
      data: { quoteId, responseId },
    });
  },

  /**
   * Accept a quote with Card on Completion via payment link (Path B).
   * Creates a confirmed booking. Customer pays later via a Paystack link
   * sent after the provider marks "Service Done".
   *
   * @param {Object} params - { quoteId, responseId, subMode? ("payment_link" default) }
   */
  acceptCardAfter: ({ quoteId, responseId, subMode = "payment_link" }) => {
    return request({
      method: "POST",
      url: "/customer/payments/accept-card-after",
      data: { quoteId, responseId, subMode },
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
