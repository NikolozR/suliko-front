import { useState, useEffect } from 'react';

interface UseCounterOptions {
  duration?: number;
  startDelay?: number;
  easing?: (t: number) => number;
}

export function useCounter(
  end: number,
  options: UseCounterOptions = {}
): number {
  const { duration = 2000, startDelay = 0, easing = (t) => t } = options;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easedProgress = easing(progress);
        const currentValue = Math.floor(startValue + (end - startValue) * easedProgress);
        
        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [end, duration, startDelay, easing]);

  return count;
}

// Easing functions
export const easingFunctions = {
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};
