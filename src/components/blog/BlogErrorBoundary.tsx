'use client';

import React from 'react';

interface BlogErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface BlogErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class BlogErrorBoundary extends React.Component<BlogErrorBoundaryProps, BlogErrorBoundaryState> {
  constructor(props: BlogErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BlogErrorBoundaryState {
    console.error('=== BLOG ERROR BOUNDARY CAUGHT ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('=== BLOG ERROR BOUNDARY DETAILS ===');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Error loading blog content. Please try again.</p>
          <details className="mt-4 text-sm text-muted-foreground">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-left bg-muted p-2 rounded text-xs overflow-auto">
              {this.state.error?.message}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
