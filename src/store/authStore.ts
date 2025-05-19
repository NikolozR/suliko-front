import {create} from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  languageId: number;
  setLanguageId: (languageId: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      languageId: -1,
      setLanguageId: (languageId) => set({ languageId }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
