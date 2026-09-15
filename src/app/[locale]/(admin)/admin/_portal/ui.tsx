"use client";

/**
 * Building blocks for Admin → Translators / Organizations, in the admin panel's
 * own look (dark surface, amber accent) rather than the main app's theme.
 * The `_portal` folder is private to the router: nothing here is a route.
 */

import React from "react";
import Link from "next/link";

export const colors = {
  page: "#0f1117",
  surface: "#13151f",
  border: "#2a2d3a",
  text: "#f8fafc",
  muted: "#94a3b8",
  faint: "#64748b",
  amber: "#f59e0b",
  amberLight: "#fbbf24",
  danger: "#fca5a5",
  success: "#86efac",
};

export function PortalAdminStyles() {
  return (
    <style>{`
      .pa-btn { transition: background 0.15s, border-color 0.15s, color 0.15s; }
      .pa-btn:hover:not(:disabled) { filter: brightness(1.08); }
      .pa-btn-ghost:hover:not(:disabled) { border-color: ${colors.amberLight} !important; color: ${colors.amberLight} !important; }
      .pa-btn:disabled { opacity: 0.5; cursor: not-allowed !important; }
      .pa-input:focus { border-color: ${colors.amberLight} !important; outline: none; }
      .pa-row:hover { background: rgba(251, 191, 36, 0.04); }
    `}</style>
  );
}

export function AdminPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ maxWidth: 1080 }}>
      <PortalAdminStyles />
      <h1
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 28,
          color: colors.text,
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        {title}
      </h1>
      <p style={{ color: colors.faint, margin: "8px 0 28px", lineHeight: 1.6 }}>{subtitle}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{children}</div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {title && (
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: 17,
                color: colors.text,
                margin: 0,
              }}
            >
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type ButtonVariant = "primary" | "ghost" | "danger";

export function AdminButton({
  variant = "ghost",
  style,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: { background: colors.amber, color: colors.page, border: `1px solid ${colors.amber}` },
    ghost: { background: "transparent", color: "#cbd5e1", border: `1px solid ${colors.border}` },
    danger: { background: "transparent", color: colors.danger, border: "1px solid rgba(239,68,68,0.35)" },
  };
  return (
    <button
      type="button"
      className={`pa-btn ${variant === "ghost" ? "pa-btn-ghost" : ""} ${className ?? ""}`}
      style={{
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        ...variants[variant],
        ...style,
      }}
      {...props}
    />
  );
}

export function AdminInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="pa-input"
      style={{
        background: colors.page,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: "9px 12px",
        color: colors.text,
        fontSize: 14,
        minWidth: 0,
        boxSizing: "border-box",
        ...style,
      }}
      {...props}
    />
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "amber" | "success" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: { color: colors.muted, background: "rgba(148,163,184,0.1)", borderColor: colors.border },
    amber: { color: colors.amberLight, background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.3)" },
    success: { color: colors.success, background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)" },
    danger: { color: colors.danger, background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 999,
        border: `1px solid ${tones.borderColor}`,
        color: tones.color,
        background: tones.background,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Message({ tone = "neutral", children }: { tone?: "neutral" | "error"; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        color: tone === "error" ? colors.danger : colors.muted,
        background: tone === "error" ? "rgba(239,68,68,0.1)" : "rgba(148,163,184,0.06)",
        border: `1px solid ${tone === "error" ? "rgba(239,68,68,0.3)" : colors.border}`,
      }}
    >
      {children}
    </div>
  );
}

/** Shown when the server says no: not signed in, or not on the admin allowlist. */
export function AccessRestricted({ signedIn }: { signedIn: boolean }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <h1
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 28,
          color: colors.text,
          margin: "0 0 12px",
        }}
      >
        Access Restricted
      </h1>
      <p style={{ color: colors.faint, lineHeight: 1.6, marginBottom: 24 }}>
        {signedIn
          ? "This account is not allowed to manage translators. Ask for its suliko.ge user id to be added to SULIKO_PORTAL_ADMIN_USER_IDS."
          : "Log in with an admin account to manage translators and organizations."}
      </p>
      {!signedIn && (
        <Link
          href="/en/admin/login"
          style={{
            display: "inline-block",
            background: colors.amber,
            color: colors.page,
            padding: "10px 24px",
            borderRadius: 8,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Go to Login
        </Link>
      )}
    </div>
  );
}
