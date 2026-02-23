'use client';

import { Toaster } from 'react-hot-toast';
import React from 'react';
import RouteTransitionProgress from "@/shared/components/RouteTransitionProgress";
import WebVitalsMonitor from "@/shared/components/WebVitalsMonitor";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteTransitionProgress />
      <WebVitalsMonitor />
      {children}
      <Toaster position="top-right" />
    </>
  );
}
