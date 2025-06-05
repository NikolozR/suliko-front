import {create} from 'zustand';
import { persist } from 'zustand/middleware';
import { useUserStore } from './userStore';

// Helper function to set cookies (client-side)
const setCookie = (name: string, value: string | null) => {
  if (typeof window !== 'undefined') {
    if (value === null) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`;
    } else {
      // Set cookie to expire in 30 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`;
    }
  }
};

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
      setToken: (token) => {
        set({ token });
        setCookie('token', token);
      },
      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
        setCookie('refreshToken', refreshToken);
      },
      reset: () => {
        set({ token: null, refreshToken: null });
        setCookie('token', null);
        setCookie('refreshToken', null);
        useUserStore.getState().clearUserData();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
