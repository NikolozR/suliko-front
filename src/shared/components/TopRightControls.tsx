'use client';

import { usePathname } from 'next/navigation';

export default function TopRightControls() {
  const pathname = usePathname();

  // Hide on landing page root paths like "/en" or "/ka" or "/pl" and blog pages
  const isLanding = /^\/[^\/]+$/.test(pathname || '');
  const isBlog = /^\/[^\/]+\/blog(\/|$)/.test(pathname || '');
  
  // Always return null since this component is not being used
  return null;
}


