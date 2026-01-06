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
      console.log("[Socket] Customer connected to Socket server");
      console.log("[Socket] Joining customer room:", customerId);
      this.socket.emit("join-customer", customerId);
    });

    this.socket.on("new-notification", (notification) => {
      console.log("[Socket] Customer notification received:", notification);

      // 1. Add to notification store
      useNotificationStore.getState().addNotification(notification);

      // 2. Refresh relevant data based on notification type
      this.refreshData(notification);
    });

    this.socket.on("disconnect", () => {
      console.log("[Socket] Customer disconnected from Socket server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Customer connection error:", error);
    });
  }

  async refreshData(notification) {
    try {
      const type = notification.type;
      const data = notification.data || {};
      const { fetchQuotes, fetchQuoteDetails, fetchBookings } =
        useDashboardStore.getState();

      // Handle Quote Response
      if (type === "quote_response_received") {
        console.log("Refreshing quotes due to new response...");
        await fetchQuotes();
        if (data.quoteId) {
          await fetchQuoteDetails(data.quoteId);
        }
      }

      // Handle Booking Updates
      if (
        type === "booking_accepted" ||
        type === "booking_confirmed" ||
        type === "booking_status_updated"
      ) {
        console.log("Refreshing bookings due to status update...");
        await fetchBookings();
      }
    } catch (error) {
      console.error("Error refreshing customer data from socket event:", error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
