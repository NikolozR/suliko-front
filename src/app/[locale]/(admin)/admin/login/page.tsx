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
      // Mark admin access in a cookie
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
    <div className="max-w-sm mx-auto mt-12">
      <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="suliko-default-bg text-primary-foreground px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}


