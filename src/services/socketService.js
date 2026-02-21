import { io } from "socket.io-client";
import useNotificationStore from "../store/useNotificationStore";
import useDashboardStore from "../store/useDashboardStore";
import { NodeURL } from "./api";

class SocketService {
  socket = null;

  connect(customerId) {
    if (this.socket) return;

    this.socket = io(NodeURL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      this.socket.emit("join-customer", customerId);
    });

    this.socket.on("new-notification", (notification) => {
      // 1. Add to notification store
      useNotificationStore.getState().addNotification(notification);

      // 2. Refresh relevant data based on notification type
      this.refreshData(notification);
    });

    this.socket.on("disconnect", () => {});

    this.socket.on("connect_error", (error) => {});
  }

  async refreshData(notification) {
    try {
      const type = notification.type;
      const data = notification.data || {};
      const { fetchQuotes, fetchQuoteDetails, fetchBookings } =
        useDashboardStore.getState();

      // Handle Quote Response
      if (type === "quote_response_received") {
        await fetchQuotes();
        if (data.quoteId) {
          await fetchQuoteDetails(data.quoteId);
        }
      }

      // Handle Booking Updates
      // Handle Booking Updates
      if (
        type === "booking_accepted" ||
        type === "quote_accepted" || // Added
        type === "booking_confirmed" ||
        type === "booking_status_updated" ||
        type === "booking_quote_received" || // Added
        type === "quote_received" || // Added
        type === "booking_declined" || // Added
        type === "booking_suggestion" || // Added
        type === "booking_cancelled" || // Added
        type === "booking_request_updated" || // Added
        type === "booking_completed_by_fitter" || // Added
        type === "booking_completed" // Added
      ) {
        if (typeof useDashboardStore.getState().fetchBookings === "function") {
          await useDashboardStore.getState().fetchBookings();
        }
      }
    } catch (error) {}
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
