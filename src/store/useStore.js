import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      darkMode: false,
      notifications: true,
      emailUpdates: false,
      user: {
        name: 'Admin User',
        email: 'admin@example.com',
        avatar: null
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
      toggleEmailUpdates: () => set((state) => ({ emailUpdates: !state.emailUpdates })),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
        notifications: state.notifications,
        emailUpdates: state.emailUpdates,
      }),
    }
  )
)

export default useStore

