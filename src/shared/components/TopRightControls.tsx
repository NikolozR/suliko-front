'use client';

import { usePathname } from 'next/navigation';

export default function TopRightControls() {
  const pathname = usePathname();

  // Hide on landing page root paths like "/en" or "/ka" or "/pl" and blog pages
  const isLanding = /^\/[^\/]+$/.test(pathname || '');
  const isBlog = /^\/[^\/]+\/blog(\/|$)/.test(pathname || '');
  if (isLanding || isBlog) return null;

  return null;
}


