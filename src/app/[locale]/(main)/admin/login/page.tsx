"use client";

import { useHydrated } from "@/shared/hooks/useHydrated";
import React, { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { login } from "@/features/auth/services/authorizationService";
import { useAuthStore } from "@/features/auth/store/authStore";
import { fetchIsAdmin } from "@/features/auth/services/adminService";

export default function AdminLoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const hydrated = useHydrated();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ phoneNumber: phoneNumber.replace(/\s+/g, ""), password });
      // Whether this account may use the panel is the API's decision, not something the browser
      // can check. Non-admin sign-ins are not kept.
      if (!(await fetchIsAdmin(res.token))) {
        throw new Error("Not authorized for admin panel");
      }
      setToken(res.token);
      setRefreshToken(res.refreshToken);
      router.push("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Geometric background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(color-mix(in srgb, var(--accent-text) 3%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--accent-text) 3%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse, color-mix(in srgb, var(--accent-text) 7%, transparent) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
          margin: "0 24px",
          background: "var(--card)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          overflow: "hidden",
          animation: "fadeUp 0.35s cubic-bezier(0.23,1,0.32,1) both",
        }}
      >
        {/* Amber top accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--accent-text), var(--accent-text), var(--accent-text))" }} />

        <div style={{ padding: "40px 36px" }}>
          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: 26,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              SULIKO
            </div>
            <div
              style={{
                fontFamily: "inherit",
                fontWeight: 400,
                fontSize: 11,
                color: "var(--accent-text)",
                letterSpacing: "0.22em",
                marginTop: 5,
                textTransform: "uppercase",
              }}
            >
              Admin Access
            </div>
          </div>

          <form method="post" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Phone Number
              </label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5XX XXX XXX"
                style={{
                  width: "100%",
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  color: "var(--foreground)",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "ui-monospace, monospace",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent-text)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  color: "var(--foreground)",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent-text)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "var(--destructive)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !hydrated}
              style={{
                marginTop: 4,
                width: "100%",
                background: loading ? "var(--background)" : "var(--accent-text)",
                color: "var(--background)",
                border: "none",
                borderRadius: 8,
                padding: "13px",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
                transition: "background 0.15s, transform 0.1s",
              }}
              onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "var(--accent-text)")}
              onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "var(--accent-text)")}
            >
              {loading ? "Authenticating..." : "Enter Panel"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
