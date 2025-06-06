import { FC, useEffect } from 'react';
import { Alert, AlertDescription } from '@/features/ui/components/ui/alert';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/features/ui/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
  className?: string;
  timeout?: number; 
}

const ErrorAlert: FC<ErrorAlertProps> = ({ 
  message, 
  onClose, 
  className,
  timeout = 5000 
}) => {
  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, timeout);

      // Cleanup timer on unmount or when onClose/timeout changes
      return () => clearTimeout(timer);
    }
  }, [onClose, timeout]);

  if (!message) return null;
  
  return (
    <div className={cn("top-[6px] right-[6px] z-[1000] w-fit", className)}>
      <Alert
        variant="destructive"
        className={cn(
          "flex items-center gap-3 bg-red-600 text-white border-none shadow-lg px-4 py-3 rounded-lg w-fit relative overflow-hidden",
          className
        )}
      >
        {timeout > 0 && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all ease-linear"
            style={{
              width: '100%',
              animationName: 'countdown',
              animationDuration: `${timeout}ms`,
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards'
            }}
          />
        )}
        <AlertCircle className="h-5 w-5 text-white shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-white break-words">{message}</AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="ml-2 rounded"
          aria-label="Close alert"
          type="button"
        >
          <X className="text-white" />
        </Button>
      </Alert>
    </div>
  );
};

export default ErrorAlert; 