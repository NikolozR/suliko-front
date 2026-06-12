import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { API_BASE_URL } from "@/shared/constants/api";
import { User as TableUser } from "./users-table";
import AdminTabsWrapper from "./AdminTabsWrapper";
import LanguageManager from "./LanguageManager";
import LanguageList from "./LanguageList";

type AdminStats = {
  pagesUsedToday: number;
  pagesUsedThisWeek: number;
  pagesUsedThisMonth: number;
  translationsThisMonth: number;
  successRateThisMonth: number;
  revenueThisMonth: number;
  newUsersThisMonth: number;
  totalPagesRemaining: number;
  generatedAtUtc: string;
};

type StatItem = { label: string; value: React.ReactNode; delay: string };

function StatCard({ label, value, delay }: StatItem) {
  return (
    <div
      style={{
        background: "#13151f",
        border: "1px solid #2a2d3a",
        borderLeft: "3px solid #f59e0b",
        borderRadius: 12,
        padding: "20px 24px",
        animation: `fadeUp 0.35s cubic-bezier(0.23,1,0.32,1) ${delay} both`,
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          fontSize: 32,
          color: "#f8fafc",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginBottom: 40,
      }}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";

  if (!token || !adminAllowed) {
    return (
      <div style={{ maxWidth: 480 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          Access Restricted
        </div>
        <p style={{ color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
          You need to log in with authorized admin credentials to access this panel.
        </p>
        <Link
          href="/en/admin/login"
          style={{
            display: "inline-block",
            background: "#f59e0b",
            color: "#0f1117",
            padding: "10px 24px",
            borderRadius: 8,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  type AdminUser = {
    id: string;
    userName: string;
    email?: string;
    phoneNUmber?: string;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    roleName?: string;
    balance?: number;
    createdAt?: string;
    lastActivityAt?: string;
    referralCode?: string;
    referredByCode?: string;
  };

  let users: AdminUser[] = [];
  let total = 0;
  let loadError: string | null = null;

  try {
    const res = await fetch(`${API_BASE_URL}/User`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      loadError = `Failed to load users: ${res.status}`;
    } else {
      const data = await res.json();
      users = (Array.isArray(data) ? data : (data?.items ?? [])) as AdminUser[];
      total = Array.isArray(data) ? data.length : (data?.total ?? users.length);
    }
  } catch (e: unknown) {
    loadError = e instanceof Error ? e.message : "Failed to load users";
  }

  // Load system-wide usage statistics (separate admin endpoint)
  let stats: AdminStats | null = null;
  try {
    const statsRes = await fetch(`${API_BASE_URL}/Statistics/admin`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (statsRes.ok) {
      stats = (await statsRes.json()) as AdminStats;
    }
  } catch {
    // Stats endpoint unavailable — usage cards fall back to "—".
  }

  // Compute "active today"
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const activeToday = users.filter((u) => {
    if (!u.lastActivityAt) return false;
    return now - new Date(u.lastActivityAt).getTime() < oneDayMs;
  }).length;

  const dash = "—"; // em dash fallback when stats are unavailable

  const overviewStats: StatItem[] = [
    { label: "Total Users", value: total.toLocaleString(), delay: "0ms" },
    { label: "Active Today", value: activeToday.toLocaleString(), delay: "80ms" },
    {
      label: "Avg Balance",
      value:
        users.length > 0
          ? (users.reduce((s, u) => s + (u.balance ?? 0), 0) / users.length).toFixed(1)
          : "0",
      delay: "160ms",
    },
    { label: "New Users (This Month)", value: stats ? stats.newUsersThisMonth.toLocaleString() : dash, delay: "240ms" },
    { label: "Pages Remaining", value: stats ? stats.totalPagesRemaining.toLocaleString() : dash, delay: "320ms" },
  ];

  const usageStats: StatItem[] = [
    { label: "Pages Used (This Month)", value: stats ? stats.pagesUsedThisMonth.toLocaleString() : dash, delay: "0ms" },
    { label: "Pages This Week", value: stats ? stats.pagesUsedThisWeek.toLocaleString() : dash, delay: "80ms" },
    { label: "Pages Today", value: stats ? stats.pagesUsedToday.toLocaleString() : dash, delay: "160ms" },
    { label: "Translations (This Month)", value: stats ? stats.translationsThisMonth.toLocaleString() : dash, delay: "240ms" },
    { label: "Success Rate", value: stats ? `${stats.successRateThisMonth}%` : dash, delay: "320ms" },
    { label: "Revenue (This Month)", value: stats ? `${stats.revenueThisMonth.toLocaleString()} ₾` : dash, delay: "400ms" },
  ];

  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 30,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
          Welcome back. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Overview stats */}
      <StatGrid stats={overviewStats} />

      {/* Usage this period */}
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: "#f8fafc",
          letterSpacing: "-0.01em",
          marginBottom: 16,
        }}
      >
        Usage
      </h2>
      <StatGrid stats={usageStats} />

      {/* Users / Referrals tabs */}
      <section style={{ marginBottom: 48 }}>
        <AdminTabsWrapper initialUsers={users as TableUser[]} loadError={loadError} />
      </section>

      {/* Languages section */}
      <section id="languages">
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#f8fafc",
            letterSpacing: "-0.01em",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg width="18" height="18" fill="none" stroke="#fbbf24" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          Languages
        </h2>
        <LanguageList />
        <LanguageManager />
      </section>

    </div>
  );
}
