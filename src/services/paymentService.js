import { request } from "./api";

/**
 * Payment Service
 * Endpoints: /customer/payments/...
 */
const paymentService = {
  /**
   * Get all payments (history + pending)
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
   * Get invoice/receipt details
   */
  getInvoice: (paymentId) => {
    // This might reuse the booking invoice endpoint or a new payment-specific one
    // For now, we can assume payments are linked to bookings and we likely have bookingId in the payment object
    // to call bookingService.getInvoice(payment.bookingId)
    // Or we could implement /customer/payments/:id/invoice backend side later.
  },
};

export default paymentService;
