'use client';

import { useEffect } from 'react';

interface BlogErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function BlogErrorBoundary({ children, fallback }: BlogErrorBoundaryProps) {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('=== CLIENT-SIDE BLOG ERROR ===');
      console.error('Error:', error.error);
      console.error('Message:', error.message);
      console.error('Filename:', error.filename);
      console.error('Lineno:', error.lineno);
      console.error('Colno:', error.colno);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('=== UNHANDLED PROMISE REJECTION ===');
      console.error('Reason:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
