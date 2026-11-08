"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  ProfileReferral,
  ProfileLanguageAndHelp,
} from "./";
import { UpdateUserProfile } from "@/features/auth/types/types.User";
import { updateUserProfile } from "@/features/auth/services/userService";
import ErrorAlert from "@/shared/components/ErrorAlert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProfileDeleteAccount } from "./ProfileDelete";
import { ProfileSavedCards } from "./";
import { ProfileSectionNav, PROFILE_SECTIONS, type ProfileSection } from "./ProfileSectionNav";
import { ProfileBalanceCard } from "./ProfileBalanceCard";
import { ProfileRecentPayments } from "./ProfileRecentPayments";
import { ProfileSubscription } from "./ProfileSubscription";
import { CouponRedeemCard } from "@/features/promoCodes";

const makeProfileUpdateSchema = (t: (key: "firstNameRequired" | "emailRequired" | "emailInvalid") => string) =>
  z.object({
    firstName: z.string().min(1, t("firstNameRequired")),
    lastName: z.string().optional(),
    email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
  });

type ProfileFormData = z.infer<ReturnType<typeof makeProfileUpdateSchema>>;

/** The open section lives in the URL hash (#billing) so it can be linked and survives a reload. */
function useSectionFromHash(): [ProfileSection, (s: ProfileSection) => void] {
  const [section, setSectionState] = useState<ProfileSection>("account");

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      setSectionState((PROFILE_SECTIONS as readonly string[]).includes(h) ? (h as ProfileSection) : "account");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const setSection = useCallback((next: ProfileSection) => {
    setSectionState(next);
    window.history.replaceState(null, "", `#${next}`);
  }, []);

  return [section, setSection];
}

export default function ProfileClient() {
  const t = useTranslations("Profile");
  const [section, setSection] = useSectionFromHash();
  const profileUpdateSchema = useMemo(() => makeProfileUpdateSchema(t), [t]);
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
    };
    
    setIsUpdating(true);
    setUpdateError(null);
    const prevUserProfile = userProfile;
    
    setUserProfile({ ...userProfile, ...editData });
    
    try {
      await updateUserProfile(editData);
      setIsEditing(false);
    } catch (error: unknown) {
      setUserProfile(prevUserProfile);
      let message = t("updateFailed");
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
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {updateError && (
        <ErrorAlert
          message={updateError}
          onClose={() => setUpdateError(null)}
        />
      )}
      <ProfileHero userProfile={currentUserProfile} />
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <ProfileSectionNav active={section} onChange={setSection} />
        <div className="min-w-0 max-w-2xl flex-1 space-y-6">
          {section === "account" && (
            <>
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
              {/* One form, one Edit: Save and Cancel live on the card above. */}
              <ProfileContactInfo
                userProfile={currentUserProfile}
                isEditing={isEditing}
                onChange={handleChange}
                isUpdating={isUpdating}
                errors={validationErrors}
              />
            </>
          )}

          {section === "billing" && (
            <>
              <ProfileBalanceCard userProfile={userProfile} />
              <ProfileRecentPayments />
              {userProfile.subscription && (
                <ProfileSubscription subscription={userProfile.subscription} onChanged={originalFetchUserProfile} />
              )}
              <ProfileSavedCards />
              <CouponRedeemCard />
            </>
          )}

          {section === "security" && (
            <>
              <ProfilePasswordChange />
              <ProfileDeleteAccount />
            </>
          )}

          {section === "preferences" && <ProfileLanguageAndHelp />}

          {section === "invite" && (
            userProfile.referralCode
              ? <ProfileReferral referralCode={userProfile.referralCode} />
              : null
          )}
        </div>
      </div>
    </div>
  );
};
