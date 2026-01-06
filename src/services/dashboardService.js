import { request } from "./api";

/**
 * Dashboard Service
 * Endpoints: /customer/dashboard/...
 */
const dashboardService = {
  /**
   * Get dashboard overview data
   */
  getDashboard: () => {
    return request({
      method: "GET",
      url: "/customer/dashboard",
    });
  },

  /**
   * Get activity feed
   */
  getActivity: (params = {}) => {
    const { page = 1, limit = 10 } = params;
    return request({
      method: "GET",
      url: `/customer/dashboard/activity?page=${page}&limit=${limit}`,
    });
  },

  /**
   * Get dashboard stats
   */
  getStats: () => {
    return request({
      method: "GET",
      url: "/customer/dashboard/stats",
    });
  },
};

export default dashboardService;
