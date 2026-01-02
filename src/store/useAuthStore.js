import { create } from "zustand";
import { persist } from "zustand/middleware";
import request, { STORAGE_KEYS, AUTH_WEB_URL } from "../services/api";
import useDashboardStore from "./useDashboardStore";

/**
 * Authentication store for customer dashboard
 * Reads token from localStorage (set by autoscreen_web)
 * Handles session validation and logout
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      /**
       * Initialize auth from localStorage
       * Called on app mount to check if user is logged in
       */
      initAuth: async () => {
        const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        console.log("[Auth] Initializing auth...", {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
        });

        if (!storedToken) {
          console.log("[Auth] No token found, not authenticated");
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }

        // If we have a stored user, use it immediately (trust localStorage)
        // This makes the dashboard load faster and avoids API failures blocking access
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("[Auth] Using stored user:", parsedUser);
            set({
              user: parsedUser,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Optionally validate with backend in background (don't block)
            get().validateTokenInBackground();
            return true;
          } catch (e) {
            console.error("[Auth] Failed to parse stored user:", e);
          }
        }

        // No stored user, must validate with backend
        try {
          console.log("[Auth] Validating token with backend...");
          const data = await request({
            method: "GET",
            url: "/api/customer/auth/me",
          });

          if (data.success && data.data) {
            console.log("[Auth] Token valid, user:", data.data);
            // Store user for future quick loads
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data));
            set({
              user: data.data,
              token: storedToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          console.log("[Auth] Token validation failed, clearing auth");
          get().clearAuth();
          return false;
        } catch (err) {
          console.error("[Auth] Auth validation error:", err);
          // If backend is down but we have a token, still allow access
          // The token will be validated on actual API calls
          set({
            user: null,
            token: storedToken,
            isAuthenticated: true, // Trust the token
            isLoading: false,
            error: "Unable to verify session",
          });
          return true;
        }
      },

      /**
       * Validate token in background (non-blocking)
       */
      validateTokenInBackground: async () => {
        try {
          const data = await request({
            method: "GET",
            url: "/api/customer/auth/me",
          });

          if (data.success && data.data) {
            // Update user data if changed
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data));
            set({ user: data.data });
          }
        } catch (err) {
          console.error("[Auth] Background validation failed:", err);
          // Don't logout on background validation failure
        }
      },

      /**
       * Clear auth state
       */
      clearAuth: () => {
        const keysToClear = [
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.USER_STATE,
          "autoscreen-auth",
          "autoscreen-dashboard",
          "autoscreen-web-auth",
          "token",
          "authToken",
          "user",
          "auth-storage",
        ];

        try {
          keysToClear.forEach((k) => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
          });
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.error("[Auth] Error clearing storage:", e);
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      /**
       * Logout user and redirect to auth page
       * NUCLEAR APPROACH: Clear storage and force hard reload
       * This bypasses the persist middleware entirely
       */
      logout: async () => {
        console.log("[AuthStore] NUCLEAR LOGOUT - Clearing all auth data...");

        // Try to call logout API, but don't block on it
        try {
          await request({
            method: "POST",
            url: "/api/customer/auth/logout",
          });
        } catch (err) {
          console.error("Logout API error:", err);
        }

        try {
          // Remove ALL auth-related keys immediately
          const authKeys = [
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER,
            STORAGE_KEYS.USER_STATE,
            "autoscreen-auth",
            "autoscreen-dashboard",
            "autoscreen-web-auth",
            "autoscreen-token",
            "autoscreen-user",
            "autoscreen-userstate",
            "token",
            "authToken",
            "user",
            "auth-storage",
          ];

          authKeys.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });

          // Clear dashboard store
          try {
            useDashboardStore.getState().clearData();
          } catch (e) {
            console.error("Dashboard store clear failed:", e);
          }

          console.log("[AuthStore] Storage cleared, forcing redirect...");
        } catch (e) {
          console.error("[AuthStore] Cleanup error:", e);
        }

        // DO NOT call set() or clearAuth() - this would trigger persist middleware
        // Instead, force an immediate redirect
        // Use replace() to prevent back button from showing logged-in state
        setTimeout(() => {
          window.location.replace(
            `${AUTH_WEB_URL}/auth?post_logout=true&role=customer&from_portal=true`
          );
        }, 50);
      },

      /**
       * Update user data
       */
      setUser: (user) => set({ user }),

      /**
       * Set token
       */
      setToken: (token) => set({ token }),

      /**
       * Set full auth state (used when receiving auth from URL)
       */
      setAuth: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      /**
       * Set error
       */
      setError: (error) => set({ error }),

      /**
       * Clear error
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: "autoscreen-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
