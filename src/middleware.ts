import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextRequest} from 'next/server';

// Helper function to get default locale based on domain (server-side)
function getDefaultLocaleForDomain(hostname: string): 'ka' | 'en' {
  if (hostname.includes('suliko.ge')) {
    return 'ka';
  }
  if (hostname.includes('suliko.io')) {
    return 'en';
  }
  return 'en'; // fallback
}

// Custom middleware to handle domain-based locale detection
const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false
});

export default function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Determine default locale based on domain
  const defaultLocale = getDefaultLocaleForDomain(hostname);
  
  // If no locale in path, redirect to domain-specific default
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (!pathnameHasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
    return Response.redirect(url);
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|payment|.*\\..*).*)'
};