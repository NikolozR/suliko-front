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
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-4 h-4'
  };

  const variantClasses = {
    default: 'bg-foreground',
    primary: 'bg-suliko-default-color',
    secondary: 'bg-slate-700 dark:bg-slate-300'
  };

  return (
    <div className={cn('flex items-center space-x-1.5', className)} role="status" aria-label="Loading">
      <div
        className={cn(
          'rounded-full animate-bounce shadow-sm',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{ 
          animationDelay: '0ms', 
          animationDuration: '1.2s',
          opacity: '0.9'
        }}
      />
      <div
        className={cn(
          'rounded-full animate-bounce shadow-sm',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{ 
          animationDelay: '200ms', 
          animationDuration: '1.2s',
          opacity: '0.9'
        }}
      />
      <div
        className={cn(
          'rounded-full animate-bounce shadow-sm',
          sizeClasses[size],
          variantClasses[variant]
        )}
        style={{ 
          animationDelay: '400ms', 
          animationDuration: '1.2s',
          opacity: '0.9'
        }}
      />
    </div>
  );
};

export default LoadingDots; 