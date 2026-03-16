"use client";
import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function AdminAuthControls({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const resetAuth = useAuthStore((s) => s.reset);

  const handleLogout = () => {
    resetAuth();
    if (typeof document !== "undefined") {
      document.cookie = `adminAllowed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure`;
    }
    router.push("/admin/login");
  };

  return (
    <button
      onClick={handleLogout}
      title={collapsed ? "Logout" : undefined}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 8,
        padding: collapsed ? "10px 0" : "10px 12px",
        background: "transparent",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 8,
        color: "#f87171",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.2)";
      }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {!collapsed && "Logout"}
    </button>
  );
}
