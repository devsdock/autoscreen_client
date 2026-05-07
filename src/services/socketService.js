import { io } from "socket.io-client";
import useNotificationStore from "../store/useNotificationStore";
import useDashboardStore from "../store/useDashboardStore";
import useBookingChatStore from "../store/useBookingChatStore";
import { NodeURL } from "./api";

class SocketService {
  socket = null;
  _activeChatId = null;

  connect(customerId) {
    if (this.socket) return;

    this.socket = io(NodeURL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      this.socket.emit("join-customer", customerId);
      // Re-join the active chat room (if any) so a cold-mount race or a
      // mid-conversation reconnect doesn't drop the user out of the
      // booking-scoped broadcast.
      if (this._activeChatId) {
        this.socket.emit("join-chat", this._activeChatId);
      }
    });

    this.socket.on("new-notification", (notification) => {
      // 1. Add to notification store
      useNotificationStore.getState().addNotification(notification);

      // 2. Booking chat — bump unread badge for offline-recipient notifications.
      // (When the user is in the chat, the dispatcher does NOT create a Notification
      // record — it routes via socket only. So receiving this means the user is
      // not currently in that chat → safe to bump.)
      if (notification.type === "booking_chat_message") {
        const bookingId = notification.data?.bookingId;
        if (bookingId) useBookingChatStore.getState().bumpUnread(String(bookingId));
      }

      // 3. Refresh relevant data based on notification type
      this.refreshData(notification);
    });

    // Booking chat — live message broadcast for users currently in the chat room.
    // Backend emits this via getIO().to(`chat_<bookingId>`).emit("booking_chat_message", ...)
    //
    // Race-safety: if the recipient just opened the panel and joined the room
    // BEFORE their initial loadChat REST call returned, the socket event will
    // arrive while `chats[bookingId]` is still undefined. `appendMessage`
    // bails when there's no existing chat in store → the message would be
    // dropped silently. Falling back to `loadChat` re-fetches the full
    // transcript (which now includes the new message), so nothing is lost.
    this.socket.on("booking_chat_message", (payload) => {
      const bookingId = payload?.bookingId;
      const message = payload?.message;
      if (!bookingId || !message) return;
      const id = String(bookingId);
      const store = useBookingChatStore.getState();
      if (store.chats[id]) {
        store.appendMessage(id, message);
      } else {
        store.loadChat(id);
      }
    });

    // Booking chat — status flipped to read_only after booking complete/cancel.
    this.socket.on("booking_chat_status_changed", (payload) => {
      const bookingId = payload?.bookingId;
      if (!bookingId) return;
      // Reload chat doc so canSendMessage flips to false in the UI.
      useBookingChatStore.getState().refreshChat(String(bookingId));
    });

    // Booking chat — unread count update (used when not in the chat tab).
    this.socket.on("booking_chat_unread_update", (payload) => {
      const bookingId = payload?.bookingId;
      if (!bookingId) return;
      useBookingChatStore.getState().bumpUnread(String(bookingId));
    });

    // Booking chat — typing indicator events. Backend broadcasts to
    // `chat_<bookingId>` room with sender excluded, so we just write to
    // store unconditionally.
    this.socket.on("chat-typing-start", (payload) => {
      if (!payload?.chatId) return;
      useBookingChatStore.getState().setTyping(payload.chatId, payload);
    });
    this.socket.on("chat-typing-stop", (payload) => {
      if (!payload?.chatId) return;
      useBookingChatStore.getState().clearTyping(payload.chatId);
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
        type === "booking_completed" ||
        type === "booking_rescheduled" ||
        type === "technician_changed"
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

  /**
   * Join the per-booking chat room so the backend's
   * `io.to('chat_<bookingId>').emit('booking_chat_message', ...)` broadcast
   * reaches this client. Without this, new messages only arrive via the
   * in-app notification path (bell icon) and the open chat panel never
   * receives the live event — user has to close + reopen to see them.
   */
  joinChat(bookingId) {
    if (!bookingId) return;
    const id = String(bookingId);
    this._activeChatId = id;
    if (this.socket?.connected) {
      this.socket.emit("join-chat", id);
    }
    // If socket isn't connected yet, the connect-handler will rejoin once
    // it fires. Same path covers reconnects.
  }

  leaveChat(bookingId) {
    const id = bookingId ? String(bookingId) : this._activeChatId;
    // Always clear the active id so the connect-handler doesn't re-emit
    // join-chat for a panel that has unmounted.
    if (this._activeChatId === id) this._activeChatId = null;
    if (!this.socket || !id) return;
    this.socket.emit("leave-chat", id);
  }

  /**
   * Emit a typing indicator to the chat room. Fires `chat-typing-start` /
   * `chat-typing-stop` events; backend broadcasts to everyone else in the
   * chat_<bookingId> room (sender excluded). Ephemeral — no DB write.
   *
   * `kind` is "start" or "stop"; `userInfo` carries the display data the
   * recipient needs to render "Sarah is typing…".
   */
  sendTyping(bookingId, kind, userInfo = {}) {
    if (!bookingId || !this.socket?.connected) return;
    const event = kind === "start" ? "chat-typing-start" : "chat-typing-stop";
    this.socket.emit(event, {
      chatId: String(bookingId),
      userId: userInfo.userId || null,
      userType: userInfo.userType || "customer",
      name: userInfo.name || null,
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
