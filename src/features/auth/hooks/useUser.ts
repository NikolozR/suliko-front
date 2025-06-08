import { useUserStore } from '@/features/auth/store/userStore';

export const useUser = () => {
  const {
    userProfile,
    loading,
    error,
    setUserProfile,
    clearUserData,
  } = useUserStore();

  const getDisplayName = () => {
    return `${userProfile?.firstName} ${userProfile?.lastName}`;
  };

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