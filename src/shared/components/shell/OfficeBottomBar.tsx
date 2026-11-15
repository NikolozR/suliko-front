"use client";

import { Languages, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

import { NAVIGATION } from "@office/shared/config/navigation";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import type { OfficeContext } from "@/shared/nav/officeNav";
import { officeHref, WORKSPACE_SECTIONS, workspaceLocale } from "@/shared/nav/workspace";

const ITEMS = new Map(NAVIGATION.flatMap((section) => section.items).map((item) => [item.href, item]));

/**
 * The one phone bar on Translate's screens, for someone signed in to Office: the
 * same five places as on Office's screens (office/.../bottom-bar.tsx): Dashboard,
 * Translate | New order | Orders, Clients. Office's places are another root
 * layout, so plain links.
 */
export function OfficeBottomBar({ office }: { office: OfficeContext }) {
  const locale = useLocale();
  const pathname = usePathname();
  const onTranslate = /\/(text|document)(\/|$)/.test(pathname);
  const label = (href: string) => office.nav.find((entry) => entry.href === href)?.label;
  const shell = (office.messages as { shell?: Record<string, string> }).shell ?? {};
  const canCreate = office.permissions.includes("orders.write");

  const officeEntry = (href: string) => {
    const item = ITEMS.get(href);
    const text = label(href);
    if (!item || !text) return null;
    const Icon = item.icon;
    return (
      <li key={href} className="min-w-0 flex-1 basis-0">
        <a
          href={officeHref(locale, href)}
          className="text-muted-foreground relative flex h-full flex-col items-center justify-center gap-0.5 rounded-lg text-[0.625rem] leading-tight transition-colors"
        >
          <Icon className={`size-5 ${HUE_CLASSES[item.hue].ink}`} aria-hidden />
          <span className="max-w-full truncate">{text}</span>
        </a>
      </li>
    );
  };

  return (
    <nav
      aria-label={shell.quickNavigation}
      className="fixed inset-x-0 bottom-0 z-40 h-16 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      <ul className="mx-auto flex h-full max-w-lg p-1">
        {officeEntry("dashboard")}
        <li className="min-w-0 flex-1 basis-0">
          <a
            href={`/${locale}/text`}
            aria-current={onTranslate ? "page" : undefined}
            className={`relative flex h-full flex-col items-center justify-center gap-0.5 rounded-lg text-[0.625rem] leading-tight transition-colors ${onTranslate ? "text-link font-semibold" : "text-muted-foreground"}`}
          >
            {onTranslate && <span aria-hidden className="bg-suliko-default-color absolute top-0 h-0.5 w-8 rounded-full" />}
            <Languages className="text-suliko-default-color size-5" aria-hidden />
            <span className="max-w-full truncate">{WORKSPACE_SECTIONS.translate[workspaceLocale(locale)]}</span>
          </a>
        </li>
        {canCreate && (
          <li className="flex flex-none items-center">
            <a
              href={officeHref(locale, "translations/new")}
              aria-label={shell.newOrder}
              className="bg-suliko-default-color hover:bg-suliko-default-hover-color flex size-11 items-center justify-center rounded-full text-white shadow-md transition-colors"
            >
              <Plus className="size-5" aria-hidden />
            </a>
          </li>
        )}
        {officeEntry("translations")}
        {officeEntry("clients")}
      </ul>
    </nav>
  );
}
