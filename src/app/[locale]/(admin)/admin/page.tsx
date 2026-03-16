import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { API_BASE_URL } from "@/shared/constants/api";
import UsersTable, { User as TableUser } from "./users-table";
import LanguageManager from "./LanguageManager";
import LanguageList from "./LanguageList";

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

  // Compute "active today"
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const activeToday = users.filter((u) => {
    if (!u.lastActivityAt) return false;
    return now - new Date(u.lastActivityAt).getTime() < oneDayMs;
  }).length;

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

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[
          { label: "Total Users", value: total, delay: "0ms" },
          { label: "Active Today", value: activeToday, delay: "80ms" },
          { label: "Avg Balance", value: users.length > 0 ? (users.reduce((s, u) => s + (u.balance ?? 0), 0) / users.length).toFixed(1) : "0", delay: "160ms" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#13151f",
              border: "1px solid #2a2d3a",
              borderLeft: "3px solid #f59e0b",
              borderRadius: 12,
              padding: "20px 24px",
              animation: `fadeUp 0.4s ease ${stat.delay} both`,
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              {stat.label}
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
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Users section */}
      <section style={{ marginBottom: 48 }}>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          Users
        </h2>
        {loadError ? (
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
        ) : (
          <UsersTable initialUsers={users as TableUser[]} />
        )}
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

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
