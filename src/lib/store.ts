import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () =>
        set((state) => {
          const newDark = !state.isDark;
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", newDark);
          }
          return { isDark: newDark };
        }),
      setDark: (dark: boolean) =>
        set(() => {
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", dark);
          }
          return { isDark: dark };
        }),
    }),
    {
      name: "theme-storage",
    }
  )
);

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
