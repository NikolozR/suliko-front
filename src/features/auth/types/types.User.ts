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

export interface UpdateUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phoneNUmber: string;
  email: string;
  userName: string;
  roleId: string;
  balance: number;
  hasSeenRegistrationBonus?: boolean;
}

export interface UserProfile extends UpdateUserProfile {
  roleName: string;
  subscription?: SubscriptionInfo | null;
}
