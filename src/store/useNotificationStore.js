import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      fetchNotifications: async () => {
        set({ isLoading: true });
        try {
          const data = await api({
            method: "GET",
            url: "/customer/notifications",
          });

          if (data.success) {
            set({
              notifications: data.data,
              unreadCount: data.unreadCount,
            });
          }
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (id) => {
        try {
          // Optimistic update
          set((state) => {
            // Check if notification is already read to avoid decrementing unreadCount incorrectly
            const notification = state.notifications.find((n) => n._id === id);
            if (notification && notification.isRead) return state;

            return {
              notifications: state.notifications.map((n) =>
                n._id === id ? { ...n, isRead: true } : n,
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          });

          await api({
            method: "PATCH",
            url: `/customer/notifications/${id}/read`,
          });
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
          // Revert optimistic update could be added here if needed
        }
      },

      markAllAsRead: async () => {
        try {
          set((state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              isRead: true,
            })),
            unreadCount: 0,
          }));

          await api({
            method: "PATCH",
            url: "/customer/notifications/read-all",
          });
        } catch (error) {
          console.error("Failed to mark all notifications as read:", error);
        }
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      deleteNotification: async (id) => {
        try {
          const notification = get().notifications.find((n) => n._id === id);
          const wasUnread = notification && !notification.isRead;

          set((state) => ({
            notifications: state.notifications.filter((n) => n._id !== id),
            unreadCount: wasUnread
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }));

          await api({
            method: "DELETE",
            url: `/customer/notifications/${id}`,
          });
        } catch (error) {
          console.error("Failed to delete notification:", error);
        }
      },

      clearAll: async () => {
        try {
          set({ notifications: [], unreadCount: 0 });
          await api({
            method: "DELETE",
            url: "/customer/notifications",
          });
        } catch (error) {
          console.error("Failed to clear notifications:", error);
        }
      },
    }),
    {
      name: "autoscreen-customer-notifications",
      partialize: (state) => ({ unreadCount: state.unreadCount }),
    },
  ),
);

export default useNotificationStore;
