'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/features/ui';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

export default function TopRightControls() {
  const pathname = usePathname();

  // Hide on landing page root paths like "/en" or "/ka" or "/pl" and blog pages
  const isLanding = /^\/[^\/]+$/.test(pathname || '');
  const isBlog = /^\/[^\/]+\/blog(\/|$)/.test(pathname || '');
  const isAdmin = /^\/[^\/]+\/admin(\/|$)/.test(pathname || '');
  if (isLanding || isBlog) return null;

  return (
    <div className="flex items-center gap-4 p-4 fixed top-0 right-0 z-50">
    </div>
  );
}


