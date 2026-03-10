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

    this.socket.on("disconnect", () => { });

    this.socket.on("connect_error", (error) => { });
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
      if (
        type === "booking_accepted" ||
        type === "quote_accepted" ||
        type === "booking_confirmed" ||
        type === "booking_status_updated" ||
        type === "booking_quote_received" ||
        type === "quote_received" ||
        type === "booking_declined" ||
        type === "booking_suggestion" ||
        type === "booking_cancelled" ||
        type === "booking_request_updated" ||
        type === "booking_completed_by_fitter" ||
        type === "booking_completed"
      ) {
        if (typeof useDashboardStore.getState().fetchBookings === "function") {
          await useDashboardStore.getState().fetchBookings();
        }
        // Also refresh quotes so quote detail panel reflects updated booking status
        if (
          type === "booking_confirmed" ||
          type === "quote_accepted" ||
          type === "booking_cancelled"
        ) {
          if (typeof useDashboardStore.getState().fetchQuotes === "function") {
            await useDashboardStore.getState().fetchQuotes();
          }
        }
      }
    } catch (error) { }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
