"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function AdminAuthControls() {
  const router = useRouter();
  const locale = useLocale();
  const resetAuth = useAuthStore((s) => s.reset);

  const handleLogout = () => {
    resetAuth();
    if (typeof document !== "undefined") {
      document.cookie = `adminAllowed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure`;
    }
    router.push(`/${locale}/admin/login`);
  };

  return (
    <button
      onClick={handleLogout}
      className="suliko-default-bg text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 relative z-50"
    >
      Logout
    </button>
  );
}


