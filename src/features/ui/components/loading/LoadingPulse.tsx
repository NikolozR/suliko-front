import React from 'react';
import { cn } from '@/shared/lib/utils';

interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
  children?: React.ReactNode;
}

const LoadingPulse: React.FC<LoadingPulseProps> = ({
  size = 'md',
  variant = 'default',
  className,
  children
}) => {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  const variantClasses = {
    default: 'bg-muted',
    primary: 'bg-suliko-default-color/10',
    secondary: 'bg-foreground/10'
  };

  return (
    <div
      className={cn(
        'rounded-lg animate-pulse',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {children}
    </div>
  );
};

export default LoadingPulse; 