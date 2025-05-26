export interface UpdateUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phoneNUmber: string;
  email: string;
  userName: string;
  roleId: string;
  balance: number;
}

export interface UserProfile extends UpdateUserProfile {
  roleName: string;
}
