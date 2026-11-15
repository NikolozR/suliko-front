"use client";
// Owned by suliko-front (clean addresses): see navigation.ts.

import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import { useLocale } from "next-intl";

import { officePath } from "./office-path";

/** The path without its prefix: "/clients/2", whichever address the page has. */
export function usePathname(): string {
  const pathname = useNextPathname() ?? "/";
  return pathname.replace(/^\/(?:app\/)?(?:ka|en)(?=\/|$)/, "") || "/";
}

type NavigateOptions = { locale?: string; scroll?: boolean };

export function useRouter() {
  const router = useNextRouter();
  const current = useLocale();
  return {
    ...router,
    push: (href: string, options?: NavigateOptions) =>
      router.push(officePath(href, options?.locale ?? current), { scroll: options?.scroll }),
    replace: (href: string, options?: NavigateOptions) =>
      router.replace(officePath(href, options?.locale ?? current), { scroll: options?.scroll }),
    prefetch: (href: string) => router.prefetch(officePath(href, current)),
  };
}
