import {create} from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './userStore';

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
        useUserStore.getState().clearUserData();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
