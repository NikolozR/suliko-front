"use client";

import { useEffect } from "react";

import { useUserStore } from "@/features/auth/store/userStore";
import { CouponRedeemCard } from "@/features/promoCodes";
import { ProfileBalanceCard } from "./ProfileBalanceCard";
import { ProfileRecentPayments } from "./ProfileRecentPayments";
import { ProfileSavedCards } from "./ProfileSavedCards";
import { ProfileSubscription } from "./ProfileSubscription";

/**
 * The person's translation pages: balance and top-up, recent payments, a
 * subscription, saved cards and a coupon. On Profile's Billing tab and on the
 * one Billing page (/ka/billing), beside the Office package.
 */
export function PagesWallet() {
  const { userProfile, fetchUserProfile } = useUserStore();

  // On an Office screen nothing else has loaded the profile yet.
  useEffect(() => {
    if (!userProfile) fetchUserProfile();
  }, [userProfile, fetchUserProfile]);

  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <ProfileBalanceCard userProfile={userProfile} />
      <ProfileRecentPayments />
      {userProfile.subscription && (
        <ProfileSubscription subscription={userProfile.subscription} onChanged={fetchUserProfile} />
      )}
      <ProfileSavedCards />
      <CouponRedeemCard />
    </div>
  );
}
