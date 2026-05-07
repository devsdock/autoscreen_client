/**
 * Booking-scoped customer<->provider chat (Point 3 — May 2026).
 * Hits /api/customer/booking-chats/* endpoints. JWT auto-attached by api.js.
 */
import api from "./api";

export const getMyChats = () =>
  api({ method: "GET", url: "/customer/booking-chats" });

export const getChat = (bookingId) =>
  api({ method: "GET", url: `/customer/booking-chats/${bookingId}` });

export const sendMessage = (bookingId, payload) =>
  api({
    method: "POST",
    url: `/customer/booking-chats/${bookingId}/messages`,
    data: payload,
  });

/**
 * Two-step image upload — caller passes a File object.
 * Returns `{ url, mimeType, sizeBytes }` to spread into the next sendMessage.
 */
export const uploadImage = (bookingId, file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api({
    method: "POST",
    url: `/customer/booking-chats/${bookingId}/messages/upload`,
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadFile = (bookingId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api({
    method: "POST",
    url: `/customer/booking-chats/${bookingId}/messages/upload-file`,
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const markRead = (bookingId) =>
  api({ method: "POST", url: `/customer/booking-chats/${bookingId}/read` });

export const getUnreadCount = () =>
  api({ method: "GET", url: "/customer/booking-chats/unread-count" });
