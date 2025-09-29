import React from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import AdminAuthControls from "./AdminAuthControls";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-3">
          {token && adminAllowed && (
            <AdminAuthControls />
          )}
          <h1 className="text-lg font-semibold">Admin</h1>
        </div>
        <nav className="text-sm flex items-center gap-3 relative z-40">
          {!token || !adminAllowed ? (
            <Link href="./login" className="underline">Login</Link>
          ) : null}
        </nav>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}


