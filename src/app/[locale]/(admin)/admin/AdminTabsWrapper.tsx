"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import UsersTable, { User } from "./users-table";
import ReferralsTab from "./referrals-tab";

type Tab = "users" | "referrals";

const TAB_LABELS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "users",
    label: "Users",
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "referrals",
    label: "Referrals",
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
  },
];

export default function AdminTabsWrapper({
  initialUsers,
  loadError,
}: {
  initialUsers: User[];
  loadError: string | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const paramTab = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    paramTab === "referrals" ? "referrals" : "users"
  );

  useEffect(() => {
    if (paramTab === "referrals" || paramTab === "users") {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "users") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid #2a2d3a",
          paddingBottom: 0,
        }}
      >
        {TAB_LABELS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                background: "transparent",
                border: "none",
                borderBottom: active ? "2px solid #fbbf24" : "2px solid transparent",
                color: active ? "#fbbf24" : "#64748b",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Syne', sans-serif",
                fontWeight: active ? 700 : 500,
                marginBottom: -1,
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
              }}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {loadError && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "14px 18px",
            color: "#fca5a5",
            fontSize: 14,
          }}
        >
          {loadError}
        </div>
      )}

      {/* Tab content */}
      {!loadError && (
        <>
          {activeTab === "users" && <UsersTable initialUsers={initialUsers} />}
          {activeTab === "referrals" && <ReferralsTab users={initialUsers} />}
        </>
      )}
    </div>
  );
}
