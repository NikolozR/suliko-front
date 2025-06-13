import React from 'react';
import { cn } from '@/shared/lib/utils';
import LoadingDots from './LoadingDots';
import { Languages, FileText, Zap } from 'lucide-react';

interface TranslationLoadingOverlayProps {
  isVisible: boolean;
  type?: 'text' | 'document' | 'suggestion';
  message?: string | null;
  progress?: number;
  className?: string;
  overlay?: boolean;
}

const TranslationLoadingOverlay: React.FC<TranslationLoadingOverlayProps> = ({
  isVisible,
  type = 'text',
  message,
  progress,
  className,
  overlay = true
}) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'document':
        return <FileText className="w-8 h-8 text-suliko-default-color" />;
      case 'suggestion':
        return <Zap className="w-8 h-8 text-suliko-default-color" />;
      default:
        return <Languages className="w-8 h-8 text-suliko-default-color" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'document':
        return 'Processing document...';
      case 'suggestion':
        return 'Applying suggestion...';
      default:
        return 'Translating text...';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-4 p-8',
        overlay && 'absolute inset-0 bg-background/80 backdrop-blur-sm z-50',
        !overlay && 'py-12',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-suliko-default-color/20 animate-ping" />
        <div className="relative bg-background rounded-full p-4 border-2 border-suliko-default-color/20">
          {getIcon()}
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">
          {message || getDefaultMessage()}
        </p>
        <div className="flex items-center justify-center">
          <LoadingDots variant="primary" />
        </div>
      </div>

      {typeof progress === 'number' && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-suliko-default-color h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationLoadingOverlay; 