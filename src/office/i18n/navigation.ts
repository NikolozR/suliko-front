// Moved from Suliko Office (app.suliko.ge), then rewritten here for clean
// addresses. Owned by suliko-front: scripts/sync-office.mjs leaves it alone.

import NextLink from "next/link";
import { redirect as nextRedirect } from "next/navigation";
import { useLocale } from "next-intl";
import { createElement, forwardRef, type ComponentProps } from "react";

/**
 * Addresses of Office's screens on suliko.ge.
 *
 * A module that has moved into this app (and is switched on, OFFICE_LOCAL_MODULES)
 * has a clean address: /ka/clients. One still answered by the Office deployment
 * keeps /app/ka/orders until it moves. Office's code writes locale-less paths
 * ("/clients/2") and these helpers put the right prefix in front, as next-intl's
 * did before; they replace createNavigation, whose prefix is the same for every
 * page.
 *
 * Which modules have moved: on the server from the environment, in the browser
 * from `window.__sulikoLocal`, which Office's root layout writes before anything
 * renders (so server and browser agree on every link).
 */

export { localModules, officePath } from "./office-path";
export { usePathname, useRouter } from "./navigation-hooks";
import { officePath } from "./office-path";

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string; locale?: string };

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, locale, ...props }, ref) {
  const current = useLocale();
  return createElement(NextLink, { ...props, ref, href: officePath(href, locale ?? current) });
});

export function getPathname({ href, locale }: { href: string; locale: string }): string {
  return officePath(href, locale);
}

export function redirect({ href, locale }: { href: string; locale: string }): never {
  nextRedirect(officePath(href, locale));
}

/** `redirect` that TypeScript knows terminates. */
export function redirectTo(href: string, locale: string): never {
  redirect({ href, locale });
}
