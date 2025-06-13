import React from 'react';
import { Button } from '@/features/ui/components/ui/button';
import { cn } from '@/shared/lib/utils';
import LoadingSpinner from './LoadingSpinner';
import LoadingDots from './LoadingDots';

interface LoadingButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  loadingAnimation?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  disabled = false,
  children,
  loadingText,
  loadingAnimation = 'spinner',
  size = 'default',
  variant = 'default',
  className,
  onClick,
  type = 'button',
  fullWidth = false
}) => {
  const renderLoadingAnimation = () => {
    switch (loadingAnimation) {
      case 'dots':
        return <LoadingDots size="sm" variant="secondary" />;
      case 'pulse':
        return (
          <div className="w-4 h-4 bg-current rounded-full animate-pulse" />
        );
      default:
        return <LoadingSpinner size="sm" variant="secondary" />;
    }
  };

  return (
    <Button
      type={type}
      size={size}
      variant={variant}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={cn(
        'relative transition-all duration-200',
        fullWidth && 'w-full',
        isLoading && 'cursor-not-allowed',
        className
      )}
    >
      <div className={cn(
        'flex items-center justify-center gap-2',
        isLoading && 'opacity-100'
      )}>
        {isLoading && renderLoadingAnimation()}
        <span className={cn(
          'transition-opacity duration-200',
          isLoading && loadingText && 'opacity-0'
        )}>
          {isLoading && loadingText ? loadingText : children}
        </span>
      </div>
      
      {/* Loading overlay for smooth transition */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2">
            {renderLoadingAnimation()}
            {loadingText && (
              <span className="animate-in fade-in duration-200">
                {loadingText}
              </span>
            )}
          </div>
        </div>
      )}
    </Button>
  );
};

export default LoadingButton; 