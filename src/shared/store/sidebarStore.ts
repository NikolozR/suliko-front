import {create} from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Always default to true for SSR and initial client state before rehydration from storage.
      // The persisted value from localStorage will overwrite this on the client if it exists.
      isCollapsed: true, 
      setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
    }),
    {
      name: 'sidebar-storage',
      // partialize: (state) => ({ isCollapsed: state.isCollapsed }), // Optional: only persist specific parts
    }
  )
);
