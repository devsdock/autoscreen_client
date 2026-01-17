import { create } from "zustand";
import { getPublicSettings } from "../services/publicSettingsService";

export const useSettingsStore = create((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await getPublicSettings();
      set({ settings, isLoading: false, error: null });
      return settings;
    } catch {
      set({ error: "Failed to fetch settings", isLoading: false });
    }
  },
}));
