'use client';

import { useEffect } from 'react';

interface BlogErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function BlogErrorBoundary({ children, fallback }: BlogErrorBoundaryProps) {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Blog rendering error:', error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
