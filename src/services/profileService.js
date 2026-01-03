import { request, STORAGE_KEYS } from "./api";

/**
 * Customer Profile Service
 */
const profileService = {
  /**
   * Get customer profile
   */
  getProfile: () => {
    return request({
      method: "GET",
      url: "/api/customer/profile",
    });
  },

  /**
   * Update customer profile
   */
  updateProfile: (data) => {
    return request({
      method: "PUT",
      url: "/api/customer/profile",
      data,
    });
  },

  /**
   * Upload profile image
   */
  uploadProfileImage: (formData) => {
    return request({
      method: "POST",
      url: "/api/customer/profile/upload-image",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Get customer addresses
   */
  getAddresses: () => {
    return request({
      method: "GET",
      url: "/api/customer/profile/addresses",
    });
  },

  /**
   * Add new address
   */
  addAddress: (data) => {
    return request({
      method: "POST",
      url: "/api/customer/profile/addresses",
      data,
    });
  },

  /**
   * Update address
   */
  updateAddress: (addressId, data) => {
    return request({
      method: "PUT",
      url: `/api/customer/profile/addresses/${addressId}`,
      data,
    });
  },

  /**
   * Delete address
   */
  deleteAddress: (addressId) => {
    return request({
      method: "DELETE",
      url: `/api/customer/profile/addresses/${addressId}`,
    });
  },

  /**
   * Get customer vehicles
   */
  getVehicles: () => {
    return request({
      method: "GET",
      url: "/api/customer/profile/vehicles",
    });
  },

  /**
   * Add new vehicle
   */
  addVehicle: (data) => {
    return request({
      method: "POST",
      url: "/api/customer/profile/vehicles",
      data,
    });
  },

  /**
   * Update vehicle
   */
  updateVehicle: (vehicleId, data) => {
    return request({
      method: "PUT",
      url: `/api/customer/profile/vehicles/${vehicleId}`,
      data,
    });
  },

  /**
   * Delete vehicle
   */
  deleteVehicle: (vehicleId) => {
    return request({
      method: "DELETE",
      url: `/api/customer/profile/vehicles/${vehicleId}`,
    });
  },

  /**
   * Change password
   */
  changePassword: (data) => {
    return request({
      method: "PUT",
      url: "/api/customer/profile/change-password",
      data,
    });
  },

  /**
   * Delete account
   */
  deleteAccount: (data) => {
    return request({
      method: "DELETE",
      url: "/api/customer/profile/delete-account",
      data,
    });
  },
};

export default profileService;
