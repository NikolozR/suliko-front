"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import {
  ProfileHero,
  ProfilePersonalInfo,
  ProfileContactInfo,
  ProfileSkeleton,
  ProfileError,
  ProfileNotFound,
} from "./";
import { UpdateUserProfile } from "@/features/auth/types/types.User";
import { updateUserProfile } from "@/features/auth/services/userService";
import ErrorAlert from "@/shared/components/ErrorAlert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "სახელი სავალდებულოა"),
  lastName: z.string().optional(),
  email: z.string().min(1, "ელ.ფოსტა სავალდებულოა").email("არასწორი ელ.ფოსტის ფორმატი"),
});

type ProfileFormData = z.infer<typeof profileUpdateSchema>;

export default function ProfileClient() {
  const { reset } = useAuthStore();
  const { token } = useAuthStore();
  const {
    userProfile,
    loading,
    error,
    fetchUserProfile: originalFetchUserProfile,
    setUserProfile,
  } = useUserStore();
  const router = useRouter();
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

  const handleLogout = () => {
    reset();
    router.push("/sign-in");
  };

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
    <div className="container mx-auto px-4 py-8">
      {updateError && (
        <ErrorAlert
          message={updateError}
          onClose={() => setUpdateError(null)}
          className="mb-6"
        />
      )}
      <ProfileHero
        userProfile={currentUserProfile}
        onLogout={handleLogout}
        isEditing={isEditing}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        isUpdating={isUpdating}
      />
      <div className="space-y-6">
        <ProfilePersonalInfo
          userProfile={currentUserProfile}
          isEditing={isEditing}
          onChange={handleChange}
          errors={validationErrors}
        />
        <ProfileContactInfo
          userProfile={currentUserProfile}
          isEditing={isEditing}
          onChange={handleChange}
          errors={validationErrors}
        />
      </div>
    </div>
  );
};
