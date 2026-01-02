import { request } from "./api";

/**
 * Dashboard Service
 */
const dashboardService = {
  /**
   * Get dashboard overview data
   */
  getDashboard: () => {
    return request({
      method: "GET",
      url: "/api/customer/dashboard",
    });
  },

  /**
   * Get activity feed
   */
  getActivity: (params = {}) => {
    const { page = 1, limit = 10 } = params;
    return request({
      method: "GET",
      url: `/api/customer/dashboard/activity?page=${page}&limit=${limit}`,
    });
  },

  /**
   * Get dashboard stats
   */
  getStats: () => {
    return request({
      method: "GET",
      url: "/api/customer/dashboard/stats",
    });
  },
};

export default dashboardService;
