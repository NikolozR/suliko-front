import {create} from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Sidebar is expanded by default. Persisted value from localStorage overwrites on client.
      isCollapsed: false, 
      setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
    }),
    {
      name: 'sidebar-storage',
      // partialize: (state) => ({ isCollapsed: state.isCollapsed }), // Optional: only persist specific parts
    }
  )
);
