import { useUserStore } from '@/store/userStore';

export const useUser = () => {
  const {
    userProfile,
    loading,
    error,
    setUserProfile,
    clearUserData,
  } = useUserStore();

  // Helper to get user display name
  const getDisplayName = () => {
    if (!userProfile) return null;
    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return userProfile.userName;
  };

  // Helper to get user initials
  const getInitials = () => {
    if (!userProfile) return '';
    const first = userProfile.firstName?.charAt(0)?.toUpperCase() || '';
    const last = userProfile.lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || userProfile.userName.charAt(0).toUpperCase();
  };

  return {
    userProfile,
    loading,
    error,
    setUserProfile,
    clearUserData,
    displayName: getDisplayName(),
    initials: getInitials(),
  };
}; 