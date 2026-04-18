"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import {
  ProfileHero,
  ProfilePersonalInfo,
  ProfileContactInfo,
  ProfilePasswordChange,
  ProfileSkeleton,
  ProfileError,
  ProfileNotFound,
} from "./";
import { UpdateUserProfile } from "@/features/auth/types/types.User";
import { updateUserProfile } from "@/features/auth/services/userService";
import { cancelSubscription } from "@/features/pricing/services/subscriptionService";
import ErrorAlert from "@/shared/components/ErrorAlert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProfileDeleteAccount } from "./ProfileDelete";
import { ProfileSavedCards } from "./";

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "სახელი სავალდებულოა"),
  lastName: z.string().optional(),
  email: z.string().min(1, "ელ.ფოსტა სავალდებულოა").email("არასწორი ელ.ფოსტის ფორმატი"),
});

type ProfileFormData = z.infer<typeof profileUpdateSchema>;

export default function ProfileClient() {
  const { token } = useAuthStore();
  const {
    userProfile,
    loading,
    error,
    fetchUserProfile: originalFetchUserProfile,
    setUserProfile,
  } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const fetchUserProfile = useCallback(() => {
    originalFetchUserProfile();
  }, [originalFetchUserProfile]);

  useEffect(() => {
    if (token && !userProfile && !loading && !error) {
      fetchUserProfile();
    }
  }, [token, userProfile, loading, error, fetchUserProfile]);

  const handleEdit = () => {
    setIsEditing(true);
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
      });
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setUpdateError(null);
    form.clearErrors();
  };

  const handleChange = (field: keyof UpdateUserProfile, value: string) => {
    form.setValue(field as keyof ProfileFormData, value);
    form.clearErrors(field as keyof ProfileFormData);
  };

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const formData = form.getValues();
    if (!userProfile) return;
    
    const editData: UpdateUserProfile = {
      id: userProfile.id,
      firstName: formData.firstName,
      lastName: formData.lastName || "",
      phoneNUmber: userProfile.phoneNUmber,
      email: formData.email,
      userName: userProfile.userName,
      roleId: userProfile.roleId,
      balance: userProfile.balance,
    };
    
    setIsUpdating(true);
    setUpdateError(null);
    const prevUserProfile = userProfile;
    
    setUserProfile({
      ...editData,
      roleName: userProfile?.roleName || "",
    });
    
    try {
      await updateUserProfile(editData);
      setIsEditing(false);
    } catch (error: unknown) {
      setUserProfile(prevUserProfile);
      let message = "პროფილის განახლებისას მოხდა შეცდომა. გთხოვთ, სცადეთ თავიდან.";
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as Record<string, unknown>).message === "string"
      ) {
        message = (error as Record<string, unknown>).message as string;
      }
      setUpdateError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || (!userProfile && !error)) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ProfileError error={error} onRetry={fetchUserProfile} />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <ProfileNotFound />
      </div>
    );
  }

  const currentUserProfile = isEditing ? {
    ...userProfile,
    ...form.getValues(),
  } : userProfile;

  const validationErrors = form.formState.errors;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {updateError && (
        <ErrorAlert
          message={updateError}
          onClose={() => setUpdateError(null)}
        />
      )}
      <ProfileHero userProfile={currentUserProfile} />
      <div className="space-y-6">
        <ProfilePersonalInfo
          userProfile={currentUserProfile}
          isEditing={isEditing}
          onChange={handleChange}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          isUpdating={isUpdating}
          errors={validationErrors}
        />
        <ProfileContactInfo
          userProfile={currentUserProfile}
          isEditing={isEditing}
          onChange={handleChange}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          isUpdating={isUpdating}
          errors={validationErrors}
        />
        <ProfilePasswordChange />

        {/* Subscription section */}
        {userProfile.subscription && (
          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-card-foreground">Subscription</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium capitalize">{userProfile.subscription.planName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${userProfile.subscription.status === 'Active' ? 'text-green-600' : userProfile.subscription.status === 'PastDue' ? 'text-amber-600' : 'text-red-600'}`}>
                  {userProfile.subscription.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pages used</span>
                <span className="font-medium">
                  {userProfile.subscription.pagesUsed} / {userProfile.subscription.monthlyPageLimit ?? '∞'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {userProfile.subscription.autoRenew ? 'Renews on' : 'Access until'}
                </span>
                <span className="font-medium">
                  {new Date(userProfile.subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              {userProfile.subscription.autoRenew && (
                <button
                  onClick={async () => {
                    setIsCanceling(true);
                    try {
                      await cancelSubscription();
                      await originalFetchUserProfile();
                    } catch {
                      /* error shown by toast in production */
                    } finally {
                      setIsCanceling(false);
                    }
                  }}
                  disabled={isCanceling}
                  className="mt-2 text-sm text-red-500 hover:text-red-600 underline disabled:opacity-50 text-left"
                >
                  {isCanceling ? 'Canceling…' : 'Cancel subscription'}
                </button>
              )}
            </div>
          </div>
        )}

        <ProfileSavedCards />
        <ProfileDeleteAccount />
      </div>
    </div>
  );
};
