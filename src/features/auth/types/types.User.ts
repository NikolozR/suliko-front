export interface SubscriptionInfo {
  id: string;
  planName: string;
  priceGel: number;
  monthlyPageLimit: number | null;
  pagesUsed: number;
  status: 'Active' | 'PastDue' | 'Canceled' | 'Expired';
  autoRenew: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phoneNUmber: string;
  email: string;
  userName: string;
  roleId: string;
  balance: number;
  hasSeenRegistrationBonus?: boolean;
  roleName: string;
  referralCode?: string;
  subscription?: SubscriptionInfo | null;
}

/**
 * Body of PUT /User: the only fields a user can change on their own profile. The API ignores
 * anything else (balance, role, user name), always updates the signed-in user, and leaves
 * omitted fields unchanged.
 */
export type UpdateUserProfile = Pick<UserProfile, "id"> &
  Partial<Pick<UserProfile, "firstName" | "lastName" | "phoneNUmber" | "email" | "hasSeenRegistrationBonus">>;
