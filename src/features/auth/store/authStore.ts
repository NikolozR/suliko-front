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
  showWelcomeModal: boolean;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setShowWelcomeModal: (show: boolean) => void;
  triggerWelcomeModal: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      showWelcomeModal: false,
      setToken: (token) => {
        set({ token });
        setCookie('token', token);
      },
      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
        setCookie('refreshToken', refreshToken);
      },
      setShowWelcomeModal: (show) => {
        set({ showWelcomeModal: show });
      },
      triggerWelcomeModal: () => {
        set({ showWelcomeModal: true });
      },
      reset: () => {
        set({ token: null, refreshToken: null, showWelcomeModal: false });
        setCookie('token', null);
        setCookie('refreshToken', null);
        useUserStore.getState().clearUserData();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        refreshToken: state.refreshToken 
        // Don't persist showWelcomeModal - it should only be triggered by manual login
      }),
    }
  )
);
