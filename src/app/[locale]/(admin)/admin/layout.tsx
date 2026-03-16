import React from "react";
import { cookies } from "next/headers";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const adminAllowed = cookieStore.get("adminAllowed")?.value === "1";
  const isAuth = !!(token && adminAllowed);

  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600&display=swap"
        rel="stylesheet"
      />
      <div
        className="admin-shell"
        style={{
          background: "#0f1117",
          color: "#f8fafc",
          fontFamily: "'Bricolage Grotesque', sans-serif",
          minHeight: "100vh",
        }}
      >
        {/* Sidebar / top-bar */}
        <AdminSidebar isAuth={isAuth} />

        {/* Main content */}
        <main className="admin-main">
          {children}
        </main>
      </div>

      <style>{`
        .admin-shell {
          display: flex;
          flex-direction: row;
        }
        .admin-nav-link:hover {
          background: rgba(251, 191, 36, 0.08);
          color: #fbbf24;
        }
        .admin-main {
          flex: 1;
          padding: 40px;
          min-width: 0;
        }
        @media (max-width: 640px) {
          .admin-main {
            padding: 20px 16px;
          }
        }
      `}</style>
    </>
  );
}
