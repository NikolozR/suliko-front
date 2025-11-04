"use client";

import { FC } from 'react';
import { Alert, AlertDescription } from '@/features/ui/components/ui/alert';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/features/ui/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
  className?: string;
  retryLabel?: string;
}

const ErrorAlert: FC<ErrorAlertProps> = ({ 
  message, 
  onClose, 
  onRetry,
  className,
  retryLabel = "Retry"
}) => {
  const t = useTranslations('ErrorAlert');
  const upsText = t('ups');
  
  // Translate "Failed to Fetch" errors to "Network Problem"
  const normalizedMessage = message.toLowerCase().includes('failed to fetch') || 
                             message.toLowerCase().includes('fetch failed') ||
                             message === 'Failed to Fetch' ||
                             message === 'Failed to fetch'
    ? t('networkProblem') 
    : message;
  
  if (!message) return null;
  
  return (
    <div className={cn(
      "fixed top-4 right-4 z-[1000] w-full max-w-md",
      "animate-slideInFromTop",
      className
    )}>
      <Alert
        variant="destructive"
        className={cn(
          "flex items-start gap-3 bg-gray-50 dark:bg-gray-800 border-t-4 border-red-500 dark:border-red-600",
          "shadow-lg px-4 py-3 rounded-lg relative",
          "border-l-0 border-r-0 border-b-0"
        )}
      >
        <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-red-600 dark:text-red-500 font-semibold text-sm shrink-0">
              {upsText}
            </h4>
            <AlertDescription className="text-gray-600 dark:text-gray-300 break-words text-sm leading-relaxed">
              {normalizedMessage}
            </AlertDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <Button
              onClick={onRetry}
              className={cn(
                "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
                "text-white font-medium text-xs px-3 py-1.5 h-auto rounded-md",
                "shadow-sm hover:shadow-md transition-all duration-200",
                "flex items-center gap-1.5"
              )}
              aria-label={retryLabel}
              type="button"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{retryLabel}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            aria-label="Close alert"
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default ErrorAlert; 