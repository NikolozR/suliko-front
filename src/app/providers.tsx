'use client';

import { Toaster } from 'react-hot-toast';
import React from 'react';
import RouteTransitionProgress from "@/shared/components/RouteTransitionProgress";
import WebVitalsMonitor from "@/shared/components/WebVitalsMonitor";
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <RouteTransitionProgress />
      <WebVitalsMonitor />
      {children}
      <Toaster position="top-right" />
    </GoogleOAuthProvider>
  );
}
