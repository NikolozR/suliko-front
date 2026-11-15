import { redirect } from "@/i18n/navigation";
import { HOME_PRODUCT } from "@/shared/constants/products";

/**
 * The site address on its own is not a page of either product. The middleware
 * already sends it to HOME_PRODUCT (keeping the query string); this is the
 * fallback for any request that reaches the route without passing through it.
 */
export default async function LocaleRoot({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: `/${HOME_PRODUCT}`, locale });
}
