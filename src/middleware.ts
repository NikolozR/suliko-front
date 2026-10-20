import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextRequest, NextResponse} from 'next/server';
import {HOME_PRODUCT, PRODUCTS} from './shared/constants/products';

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
  
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // The bare site address is neither product: it hands the visitor on to
  // HOME_PRODUCT. A temporary redirect (307), so the choice can change without
  // browsers or search engines holding on to the old one, and in one hop from
  // `/` rather than two. The query string stays, so UTM tags and ad click ids
  // reach the page.
  const localeRoot = routing.locales.find((locale) => pathname === `/${locale}` || pathname === `/${locale}/`);
  if (pathname === '/' || localeRoot) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeRoot ?? defaultLocale}/${HOME_PRODUCT}`;
    return NextResponse.redirect(url, 307);
  }

  // /Office and /TRANSLATE are typed by hand: send them to the real address.
  const [, first, second] = pathname.split('/');
  const productSegment = pathnameHasLocale ? second : first;
  if (productSegment && productSegment !== productSegment.toLowerCase()
      && (PRODUCTS as readonly string[]).includes(productSegment.toLowerCase())) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(productSegment, productSegment.toLowerCase());
    return NextResponse.redirect(url, 308);
  }

  // If no locale in path, redirect to domain-specific default
  if (!pathnameHasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return Response.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|payment|.*\\..*).*)'
};