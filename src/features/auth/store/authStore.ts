import {create} from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      reset: () => {
        set({ token: null, refreshToken: null });
        
        import('./userStore').then(({ useUserStore }) => {
          useUserStore.getState().clearUserData();
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
