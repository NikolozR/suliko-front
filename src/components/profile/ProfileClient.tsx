"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import {
  ProfileHero,
  ProfilePersonalInfo,
  ProfileContactInfo,
  ProfileSkeleton,
  ProfileError,
  ProfileNotFound,
} from "./";
import { UpdateUserProfile } from "@/types/types.User";
import { updateUserProfile } from "@/services/userService";
import ErrorAlert from "@/components/ErrorAlert";

export const ProfileClient = () => {
  const { token, reset } = useAuthStore();
  const {
    userProfile,
    loading,
    error,
    fetchUserProfile,
    setUserProfile,
  } = useUserStore();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateUserProfile | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/authorization");
      return;
    }
    if (!userProfile && !loading && !error) {
      fetchUserProfile();
    }
  }, [token, userProfile, loading, error, fetchUserProfile, router]);

  useEffect(() => {
    if (isEditing && userProfile) {
      setEditData({
        id: userProfile.id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phoneNUmber: userProfile.phoneNUmber,
        email: userProfile.email,
        userName: userProfile.userName,
        roleId: userProfile.roleId,
        balance: userProfile.balance,
      });
    }
    if (!isEditing) {
      setEditData(null);
    }
  }, [isEditing, userProfile]);

  const handleLogout = () => {
    reset();
    router.push("/authorization");
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setUpdateError(null);
  };

  const handleChange = (field: keyof UpdateUserProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleSave = async () => {
    if (editData) {
      setIsUpdating(true);
      setUpdateError(null);
      const prevUserProfile = userProfile;
      setUserProfile({
        ...editData,
        roleName: userProfile?.roleName || "",
      });
      try {
        console.log(editData);
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
    }
  };

  if (!token) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <ProfileError error={error} onRetry={fetchUserProfile} />;
  }

  if (!userProfile) {
    return <ProfileNotFound />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[#181c2a] dark:via-[#232a45] dark:to-[#232a45]">
      <div className="container mx-auto px-4 py-8">
        {updateError && (
          <ErrorAlert
            message={updateError}
            onClose={() => setUpdateError(null)}
            className="mb-6"
          />
        )}
        <ProfileHero
          userProfile={isEditing && editData ? {
            ...editData,
            roleName: userProfile?.roleName || "",
          } : userProfile}
          onLogout={handleLogout}
          isEditing={isEditing}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          isUpdating={isUpdating}
        />
        <div className="space-y-6">
          <ProfilePersonalInfo
            userProfile={isEditing && editData ? {
              ...editData,
              roleName: userProfile?.roleName || "",
            } : userProfile}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <ProfileContactInfo
            userProfile={isEditing && editData ? {
              ...editData,
              roleName: userProfile?.roleName || "",
            } : userProfile}
            isEditing={isEditing}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
};
