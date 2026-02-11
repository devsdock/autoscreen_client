import { request } from "./api";

/**
 * Booking Service
 * Endpoints: /customer/bookings/...
 */
const bookingService = {
  /**
   * Get all bookings
   */
  getBookings: (params = {}) => {
    const { status, type, page = 1, limit = 10 } = params;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append("status", status);
    if (type) queryParams.append("type", type);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    return request({
      method: "GET",
      url: `/customer/bookings?${queryParams.toString()}`,
    });
  },

  /**
   * Get single booking
   */
  getBooking: (bookingId) => {
    return request({
      method: "GET",
      url: `/customer/bookings/${bookingId}`,
    });
  },

  /**
   * Get upcoming bookings
   */
  getUpcomingBookings: () => {
    return request({
      method: "GET",
      url: "/customer/bookings/upcoming",
    });
  },

  /**
   * Get booking history
   */
  getBookingHistory: (params = {}) => {
    const { page = 1, limit = 10 } = params;
    return request({
      method: "GET",
      url: `/customer/bookings/history?page=${page}&limit=${limit}`,
    });
  },

  /**
   * Cancel a booking
   */
  cancelBooking: (bookingId, reason) => {
    return request({
      method: "PUT",
      url: `/customer/bookings/${bookingId}/cancel`,
      data: { reason },
    });
  },

  /**
   * Reschedule a booking
   */
  rescheduleBooking: (bookingId, data) => {
    return request({
      method: "PUT",
      url: `/customer/bookings/${bookingId}/reschedule`,
      data,
    });
  },

  /**
   * Add review to completed booking
   */
  addReview: (bookingId, data) => {
    return request({
      method: "POST",
      url: `/customer/bookings/${bookingId}/review`,
      data,
    });
  },

  // ============================================
  // BROADCAST BOOKING FLOW METHODS
  // ============================================

  /**
   * Upload damage images
   */
  uploadDamageImages: (formData) => {
    return request({
      method: "POST",
      url: "/customer/bookings/upload-images",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Create a new booking request (broadcast to providers)
   * This creates booking in "searching" status and broadcasts to nearby providers
   */
  createBookingRequest: (data) => {
    if (!data.serviceAddress?.coordinates) {
    } else {
    }

    return request({
      method: "POST",
      url: "/customer/bookings",
      data,
    });
  },

  /**
   * Get booking request status (for polling during search)
   * Use this to check if a provider has accepted
   */
  getBookingStatus: (bookingId) => {
    return request({
      method: "GET",
      url: `/customer/bookings/${bookingId}/status`,
    });
  },

  /**
   * Process payment for accepted booking
   * Called after provider accepts to complete the booking
   */
  processBookingPayment: (bookingId, paymentData) => {
    return request({
      method: "POST",
      url: `/customer/bookings/${bookingId}/payment`,
      data: paymentData,
    });
  },

  /**
   * Complete booking (after job is finished)
   */
  completeBooking: (bookingId) => {
    return request({
      method: "POST",
      url: `/customer/bookings/${bookingId}/complete`,
    });
  },

  /**
   * Get invoice data
   */
  getInvoice: (bookingId) => {
    return request({
      method: "GET",
      url: `/customer/bookings/${bookingId}/invoice`,
    });
  },

  /**
   * Check availability of providers
   */
  checkAvailability: (data) => {
    return request({
      method: "POST",
      url: "/customer/bookings/check-availability",
      data,
    });
  },

  /**
   * Respond to a provider quote (Accept/Decline)
   * @param {string} bookingId
   * @param {string} providerId
   * @param {string} action - 'accept' or 'reject'
   */
  respondToQuote: (bookingId, providerId, action) => {
    return request({
      method: "POST",
      url: `/customer/bookings/${bookingId}/quote`,
      data: { providerId, action },
    });
  },
};

export default bookingService;
