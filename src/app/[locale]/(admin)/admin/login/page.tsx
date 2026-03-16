"use client";
import React, { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { login } from "@/features/auth/services/authorizationService";
import { useAuthStore } from "@/features/auth/store/authStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalizePhone = (p: string) => p.replace(/\s+/g, "");
      const allowedPhone = normalizePhone("579 737 737");
      const inputPhone = normalizePhone(phoneNumber);
      const allowedPassword = "M.t.2002";
      if (inputPhone !== allowedPhone || password !== allowedPassword) {
        throw new Error("Not authorized for admin panel");
      }
      const res = await login({ phoneNumber, password });
      setToken(res.token);
      setRefreshToken(res.refreshToken);
      if (typeof document !== "undefined") {
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        document.cookie = `adminAllowed=1; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`;
      }
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
        background: "#0f1117",
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
            linear-gradient(rgba(251,191,36,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,191,36,0.03) 1px, transparent 1px)
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
          background: "radial-gradient(ellipse, rgba(251,191,36,0.07) 0%, transparent 70%)",
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
          background: "#13151f",
          borderRadius: 16,
          border: "1px solid #2a2d3a",
          overflow: "hidden",
          animation: "fadeUp 0.4s ease both",
        }}
      >
        {/* Amber top accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)" }} />

        <div style={{ padding: "40px 36px" }}>
          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color: "#f8fafc",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              SULIKO
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 400,
                fontSize: 11,
                color: "#fbbf24",
                letterSpacing: "0.22em",
                marginTop: 5,
                textTransform: "uppercase",
              }}
            >
              Admin Access
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#64748b",
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
                placeholder="579 737 737"
                style={{
                  width: "100%",
                  background: "#0f1117",
                  border: "1px solid #2a2d3a",
                  borderRadius: 8,
                  padding: "12px 14px",
                  color: "#f8fafc",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#fbbf24")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2d3a")}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#64748b",
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
                  background: "#0f1117",
                  border: "1px solid #2a2d3a",
                  borderRadius: 8,
                  padding: "12px 14px",
                  color: "#f8fafc",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#fbbf24")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2d3a")}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#fca5a5",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                width: "100%",
                background: loading ? "#92400e" : "#f59e0b",
                color: "#0f1117",
                border: "none",
                borderRadius: 8,
                padding: "13px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
                transition: "background 0.15s, transform 0.1s",
              }}
              onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#fbbf24")}
              onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.background = "#f59e0b")}
            >
              {loading ? "Authenticating..." : "Enter Panel"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
