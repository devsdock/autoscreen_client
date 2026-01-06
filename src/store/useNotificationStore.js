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
          const response = await api.get("/notifications");
          if (response.data.success) {
            set({
              notifications: response.data.data,
              unreadCount: response.data.unreadCount,
            });
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (id) => {
        try {
          // Optimistic update
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n._id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));

          await api.patch(`/notifications/${id}/read`);
        } catch (error) {
          console.error("Error marking notification as read:", error);
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

          await api.patch("/notifications/read-all");
        } catch (error) {
          console.error("Error marking all as read:", error);
        }
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },
    }),
    {
      name: "autoscreen-customer-notifications",
      partialize: (state) => ({ unreadCount: state.unreadCount }),
    }
  )
);

export default useNotificationStore;
