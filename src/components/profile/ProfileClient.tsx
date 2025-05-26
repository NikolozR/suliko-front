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
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/types.User";

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
  const [editData, setEditData] = useState<UserProfile | null>(null);

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
      setEditData(userProfile);
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
  const handleCancel = () => setIsEditing(false);

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleSave = () => {
    if (editData) {
      setUserProfile(editData);
      setIsEditing(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <ProfileHero
          userProfile={isEditing && editData ? editData : userProfile}
          onLogout={handleLogout}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
        <div className="space-y-6">
          <ProfilePersonalInfo
            userProfile={isEditing && editData ? editData : userProfile}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <ProfileContactInfo
            userProfile={isEditing && editData ? editData : userProfile}
            isEditing={isEditing}
            onChange={handleChange}
          />
          {isEditing && (
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={handleCancel}>გაუქმება</Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">შენახვა</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
