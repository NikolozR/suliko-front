import {create} from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  targetLanguageId: number;
  setTargetLanguageId: (targetLanguageId: number) => void;
  sourceLanguageId: number;
  setSourceLanguageId: (sourceLanguageId: number) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      targetLanguageId: -1,
      setTargetLanguageId: (targetLanguageId) => set({ targetLanguageId }),
      sourceLanguageId: -1,
      setSourceLanguageId: (sourceLanguageId) => set({ sourceLanguageId }),
      reset: () => {
        set({ token: null, refreshToken: null, targetLanguageId: -1, sourceLanguageId: -1 });
        
        // Clear user data when logging out
        // We import this dynamically to avoid circular dependencies
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
