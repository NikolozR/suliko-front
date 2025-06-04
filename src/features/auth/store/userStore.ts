import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '@/features/auth/types/types.User';
import { getUserProfile } from '@/features/auth/services/userService';

interface UserState {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserProfile: () => Promise<void>;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      loading: false,
      error: null,

      setUserProfile: (profile) => set({ userProfile: profile }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),

      fetchUserProfile: async () => {
        try {
          set({ loading: true, error: null });
          const profile = await getUserProfile();
          set({ userProfile: profile, loading: false });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load profile";
          set({ error: errorMessage, loading: false });
          if (err instanceof Error && err.message.includes("No token found")) {
            get().clearUserData();
          }
        }
      },

      clearUserData: () => set({ 
        userProfile: null, 
        loading: false, 
        error: null 
      }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ userProfile: state.userProfile }),
    }
  )
); 