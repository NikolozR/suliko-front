import React from 'react';
import { cn } from '@/shared/lib/utils';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const variantClasses = {
    default: 'bg-muted-foreground',
    primary: 'bg-suliko-default-color',
    secondary: 'bg-foreground'
  };

  return (
    <div className={cn('flex items-center space-x-1', className)} role="status" aria-label="Loading">
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
      />
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
      />
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
      />
    </div>
  );
};

export default LoadingDots; 