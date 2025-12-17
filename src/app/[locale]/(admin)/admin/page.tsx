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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Admin</h2>
        <p className="text-muted-foreground">You need to log in with authorized admin credentials to access the admin panel.</p>
        <Link className="underline" href="/en/admin/login">Go to login</Link>
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="text-muted-foreground">Welcome to the Suliko Admin Panel.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
      </div>

      {loadError ? (
        <div className="text-red-600 text-sm">{loadError}</div>
      ) : (
        <UsersTable initialUsers={users as TableUser[]} />
      )}

      {/* Language List */}
      <LanguageList />

      {/* Language Manager */}
      <LanguageManager />
    </div>
  );
}


