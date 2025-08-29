'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

export default function BetaBanner() {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full flex justify-center fixed top-0 left-0 z-40 pointer-events-none">
      <div 
        className={cn(
          "backdrop-blur bg-suliko-default-color/80 dark:bg-slate-800/80 text-white dark:text-slate-200",
          "px-6 py-2 rounded-b-lg shadow-md text-sm font-medium pointer-events-auto",
          "border-b border-suliko-default-color/30 dark:border-slate-700/50",
          "transition-opacity duration-500",
          "animate-in fade-in slide-in-from-top-2"
        )}
      >
        {t("BetaBanner")}
      </div>
    </div>
  );
}
