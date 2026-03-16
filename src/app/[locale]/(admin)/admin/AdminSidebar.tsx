"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminAuthControls from "./AdminAuthControls";

export default function AdminSidebar({ isAuth }: { isAuth: boolean }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin-sidebar-collapsed");
      if (saved !== null) setCollapsed(saved === "true");
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      try { localStorage.setItem("admin-sidebar-collapsed", String(!v)); } catch {}
      return !v;
    });
  };

  const w = collapsed ? 56 : 220;

  return (
    <aside
      style={{
        width: w,
        minHeight: "100vh",
        background: "#13151f",
        borderRight: "1px solid #2a2d3a",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
        transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
      }}
    >
      {/* Brand + toggle */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "22px 24px 16px",
          borderBottom: "1px solid #2a2d3a",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          transition: "padding 0.22s",
          minHeight: 68,
        }}
      >
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fbbf24", letterSpacing: "-0.02em", lineHeight: 1 }}>
              SULIKO
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 400, fontSize: 10, color: "#64748b", letterSpacing: "0.18em", marginTop: 4, textTransform: "uppercase" }}>
              Admin Panel
            </div>
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            padding: 4,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#fbbf24")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")}
        >
          {collapsed ? (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      {isAuth && (
        <nav style={{ padding: collapsed ? "12px 0" : "14px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2, transition: "padding 0.22s" }}>
          <NavLink href="/en/admin" label="Users" collapsed={collapsed}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </NavLink>
          <NavLink href="/en/admin#languages" label="Languages" collapsed={collapsed}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </NavLink>
        </nav>
      )}

      {/* Footer */}
      <div style={{ padding: collapsed ? "12px 0" : "12px 10px", borderTop: "1px solid #2a2d3a", transition: "padding 0.22s" }}>
        {isAuth ? (
          <AdminAuthControls collapsed={collapsed} />
        ) : (
          <Link
            href="./login"
            title="Login"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 8,
              padding: collapsed ? "10px 0" : "10px 12px",
              background: "#fbbf24",
              color: "#0f1117",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              fontFamily: "'Syne', sans-serif",
              transition: "all 0.22s",
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            {!collapsed && "Login"}
          </Link>
        )}
      </div>
    </aside>
  );
}

function NavLink({ href, label, collapsed, children }: { href: string; label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
        padding: collapsed ? "10px 0" : "10px 12px",
        borderRadius: 8,
        color: "#94a3b8",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 500,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
      className="admin-nav-link"
    >
      {children}
      {!collapsed && label}
    </Link>
  );
}
