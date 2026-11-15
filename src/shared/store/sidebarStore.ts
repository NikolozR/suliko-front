import {create} from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  /** On a phone the sidebar is a drawer over the page; this is whether it is open. Not kept. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Sidebar is expanded by default. Persisted value from localStorage overwrites on client.
      isCollapsed: false, 
      setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
      mobileOpen: false,
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    {
      name: 'sidebar-storage',
      // The drawer starts closed on every page load.
      partialize: (state) => ({ isCollapsed: state.isCollapsed }) as SidebarState,
    }
  )
);
