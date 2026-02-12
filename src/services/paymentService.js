import { request } from "./api";

/**
 * Payment Service
 * Endpoints: /customer/payments/...
 * Supports both simple Stripe payments and Stripe Connect destination charges
 */
const paymentService = {
  getConfig: () => {
    return request({
      method: "GET",
      url: "/customer/payments/config",
    });
  },

  /**
   * Get all payments (history + pending)
   * Includes Stripe Connect transactions and legacy payments
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
   * Create a Stripe Payment Intent
   * If provider has Stripe Connect, creates a destination charge
   * Otherwise, creates a simple payment intent
   *
   * @returns {Object} Response with clientSecret, id, and optionally:
   *   - isConnectPayment: boolean - whether this is a Connect destination charge
   *   - platformFee: number - platform commission (only for Connect)
   *   - providerAmount: number - amount going to provider (only for Connect)
   */
  createPaymentIntent: (bookingId) => {
    return request({
      method: "POST",
      url: "/customer/payments/create-intent",
      data: { bookingId },
    });
  },
};

export default paymentService;
