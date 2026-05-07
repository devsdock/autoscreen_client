/**
 * Booking-scoped chat store (Point 3 — May 2026).
 *
 * One chat per booking. Tracks the loaded chats keyed by bookingId, plus a
 * per-booking unread count and the global unread total used by the sidebar
 * badge. Socket handlers (in services/socketService.js) call appendMessage
 * and bumpUnread when a `booking_chat_message` event arrives.
 *
 * Not persisted — all state is rebuilt from the server on app load via
 * refreshGlobalUnread() called from App.jsx.
 */
import { create } from "zustand";
import * as svc from "../services/bookingChatService";

const useBookingChatStore = create((set, get) => ({
  chats: {},                  // { [bookingId]: chatDoc }
  unreadByBooking: {},        // { [bookingId]: number }
  globalUnread: 0,
  loading: false,
  activeBookingId: null,      // which chat the user is currently viewing (suppresses bumpUnread)
  // Per-booking typing indicator state, written by the socketService when
  // chat-typing-start arrives. Shape: { [bookingId]: { userId, userType, name, expiresAt } }
  typingByBooking: {},

  setActiveBookingId: (bookingId) => set({ activeBookingId: bookingId || null }),

  loadChat: async (bookingId) => {
    if (!bookingId) return null;
    set({ loading: true });
    try {
      const res = await svc.getChat(bookingId);
      if (res?.success && res.data) {
        set((state) => ({
          chats: { ...state.chats, [bookingId]: res.data },
        }));
        return res.data;
      }
      return null;
    } catch (err) {
      console.error("loadChat failed:", err?.message || err);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  /** Append a single message to a loaded chat. Used by REST send + socket events. */
  appendMessage: (bookingId, message) => {
    if (!bookingId || !message) return;
    set((state) => {
      const existing = state.chats[bookingId];
      if (!existing) return state; // chat not loaded yet — nothing to append
      const messages = existing.messages || [];

      // When a NON-optimistic server message arrives, replace the oldest
      // optimistic message from the same sender (FIFO — sends are serial).
      // The optimistic and server timestamps differ (client vs server clock),
      // so a pure createdAt-based dedup wouldn't match them. Replacing in
      // place preserves message order and removes the duplicate.
      if (!message._optimistic && message.sender?.userId) {
        const senderId = String(message.sender.userId);
        const optIdx = messages.findIndex(
          (m) =>
            m._optimistic === true &&
            String(m.sender?.userId) === senderId
        );
        if (optIdx >= 0) {
          return {
            chats: {
              ...state.chats,
              [bookingId]: {
                ...existing,
                messages: [
                  ...messages.slice(0, optIdx),
                  message,
                  ...messages.slice(optIdx + 1),
                ],
                lastMessageAt: message.createdAt,
              },
            },
          };
        }
      }

      // Fallback dedup: same createdAt + sender (covers the rare case where
      // the same server message arrives twice — e.g. socket reconnect echo).
      const isDuplicate = messages.some(
        (m) =>
          m.createdAt === message.createdAt &&
          String(m.sender?.userId) === String(message.sender?.userId)
      );
      if (isDuplicate) return state;
      return {
        chats: {
          ...state.chats,
          [bookingId]: {
            ...existing,
            messages: [...(existing.messages || []), message],
            lastMessageAt: message.createdAt,
          },
        },
      };
    });
  },

  /** Called by the socket handler when a new message arrives AND user isn't viewing this chat. */
  bumpUnread: (bookingId) => {
    if (!bookingId) return;
    if (get().activeBookingId === String(bookingId)) return; // user is here, don't bump
    set((state) => {
      const current = state.unreadByBooking[bookingId] || 0;
      return {
        unreadByBooking: { ...state.unreadByBooking, [bookingId]: current + 1 },
        globalUnread: state.globalUnread + 1,
      };
    });
  },

  markChatRead: async (bookingId) => {
    if (!bookingId) return;
    try {
      await svc.markRead(bookingId);
      set((state) => {
        const wasUnread = state.unreadByBooking[bookingId] || 0;
        return {
          unreadByBooking: { ...state.unreadByBooking, [bookingId]: 0 },
          globalUnread: Math.max(0, state.globalUnread - wasUnread),
        };
      });
    } catch (err) {
      console.error("markChatRead failed:", err?.message || err);
    }
  },

  refreshGlobalUnread: async () => {
    try {
      const res = await svc.getUnreadCount();
      if (res?.success && res.data) {
        set({ globalUnread: Number(res.data.unreadCount) || 0 });
      }
    } catch (err) {
      console.error("refreshGlobalUnread failed:", err?.message || err);
    }
  },

  /** Called on chat close (read-only) — refresh the chat doc so canSendMessage flips. */
  refreshChat: async (bookingId) => get().loadChat(bookingId),

  /** Typing indicator received from another participant. */
  setTyping: (bookingId, payload) => {
    if (!bookingId || !payload) return;
    set((state) => ({
      typingByBooking: {
        ...state.typingByBooking,
        [String(bookingId)]: {
          userId: payload.userId || null,
          userType: payload.userType || null,
          name: payload.name || null,
          expiresAt: Date.now() + 5000, // safety: drop after 5 s if stop event missed
        },
      },
    }));
  },

  clearTyping: (bookingId) => {
    if (!bookingId) return;
    set((state) => {
      const next = { ...state.typingByBooking };
      delete next[String(bookingId)];
      return { typingByBooking: next };
    });
  },

  /** Reset on logout. */
  clear: () =>
    set({
      chats: {},
      unreadByBooking: {},
      globalUnread: 0,
      loading: false,
      activeBookingId: null,
      typingByBooking: {},
    }),
}));

export default useBookingChatStore;
