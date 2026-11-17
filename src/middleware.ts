import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextRequest, NextResponse} from 'next/server';
import {HOME_PRODUCT, PRODUCTS} from './shared/constants/products';
import {isOfficeRequest, officeZone} from './office-zone';

// Helper function to get default locale based on domain (server-side)
function getDefaultLocaleForDomain(hostname: string): 'ka' | 'en' {
  if (hostname.includes('suliko.ge')) {
    return 'ka';
  }
  if (hostname.includes('suliko.ai') || hostname.includes('suliko.io')) {
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
  // Suliko Office: /app/..., and the clean addresses of its moved modules.
  if (isOfficeRequest(request.nextUrl.pathname)) {
    return officeZone(request) ?? NextResponse.next();
  }

  // Signed in to Office, the bureau assignments list is Orders' "From bureaus"
  // view. (An assignment's own page stays where it is.)
  const assignments = /^\/(ka|en|pl)\/assignments\/?$/.exec(request.nextUrl.pathname);
  if (assignments && request.cookies.has('suliko_session')) {
    const lang = assignments[1] === 'pl' ? 'en' : assignments[1];
    return NextResponse.redirect(new URL(`/${lang}/orders?view=bureaus`, request.url), 307);
  }

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
  //
  // English is the one exception: its bare address is itself the international
  // landing page (`[locale]/page.tsx`), not a redirect to either product — so a
  // request for it is left alone here and falls through to the locale-prefixing
  // logic and intlMiddleware below, same as any other English page.
  const localeRoot = routing.locales.find((locale) => pathname === `/${locale}` || pathname === `/${locale}/`);
  const rootLocale = localeRoot ?? (pathname === '/' ? defaultLocale : undefined);
  if (rootLocale && rootLocale !== 'en') {
    const url = request.nextUrl.clone();
    url.pathname = `/${rootLocale}/${HOME_PRODUCT}`;
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
  // /app is Suliko Office: see office-zone.ts.
  matcher: '/((?!api|trpc|_next|_vercel|payment|.*\\..*).*)'
};