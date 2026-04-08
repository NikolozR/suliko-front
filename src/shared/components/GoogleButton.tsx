"use client";
import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// Hoisted at module level — no re-creation on render (rendering-hoist-jsx)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
  </svg>
);

interface GoogleButtonProps {
  onSuccess: (response: { credential?: string }) => void;
  onError: () => void;
  label?: string;
}

export default function GoogleButton({
  onSuccess,
  onError,
  label = "Continue with Google",
}: GoogleButtonProps) {
  const { resolvedTheme } = useTheme();
  // rendering-hydration-no-flicker: guard against SSR mismatch on theme
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    // group enables hover state on the visual layer via group-hover
    <div className="relative w-full h-11 group cursor-pointer select-none">
      {/* Visual layer — pointer-events-none so clicks pass through to the iframe */}
      <div
        className={`absolute inset-0 flex items-center justify-center gap-2.5 rounded-lg border text-sm font-medium pointer-events-none transition-colors duration-150 ${
          isDark
            ? "bg-white/[0.07] group-hover:bg-white/[0.13] border-white/[0.14] text-white"
            : "bg-white group-hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm"
        }`}
      >
        <GoogleIcon />
        <span>{label}</span>
      </div>

      {/*
        Transparent Google button on top — opacity-0 so it's invisible,
        but it's still the topmost interactive layer that intercepts all clicks.
        [&_div]:!w-full / [&_iframe]:!w-full / !h-full force the inner DOM
        to fill the container so the entire button area is clickable.
      */}
      <div className="absolute inset-0 opacity-0 overflow-hidden rounded-lg [&_div]:!w-full [&_div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap={false}
          width="100%"
          size="large"
        />
      </div>
    </div>
  );
}
