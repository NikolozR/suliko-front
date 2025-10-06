import { useState, useEffect, useRef } from 'react';

interface UseCountdownOptions {
  initialMinutes: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  timeLeft: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
  start: () => void;
  stop: () => void;
  reset: (newMinutes?: number) => void;
  formatTime: () => string;
}

export function useCountdown({
  initialMinutes,
  onComplete,
  autoStart = false
}: UseCountdownOptions): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = () => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const start = () => {
    if (intervalRef.current) return;
    
    setIsComplete(false);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = (newMinutes?: number) => {
    stop();
    setTimeLeft((newMinutes || initialMinutes) * 60);
    setIsComplete(false);
  };

  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      stop();
    };
  }, [autoStart, start]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return {
    timeLeft,
    minutes,
    seconds,
    isComplete,
    start,
    stop,
    reset,
    formatTime
  };
}
