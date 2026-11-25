"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface Entry {
  key: string;
  /** Without the language. */
  href: string;
  /** Which of the two checks lets a person see it. */
  group: "translate" | "office";
}

const ENTRIES: Entry[] = [
  { key: "users", href: "/admin", group: "translate" },
  { key: "referrals", href: "/admin?tab=referrals", group: "translate" },
  { key: "revenue", href: "/admin/revenue", group: "translate" },
  { key: "promoCodes", href: "/admin/promo-codes", group: "translate" },
  { key: "languages", href: "/admin#languages", group: "translate" },
  { key: "blog", href: "/admin/blog", group: "translate" },
  { key: "passportTemplates", href: "/admin/passport-templates", group: "translate" },
  { key: "workspaces", href: "/admin/workspaces", group: "office" },
  { key: "platformBilling", href: "/admin/workspaces/billing", group: "office" },
];

function Items({ locale, access, labels }: Props) {
  const pathname = usePathname() ?? "";
  const tab = useSearchParams()?.get("tab");
  const path = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  const isCurrent = (entry: Entry) => {
    const [target, query] = entry.href.split("?");
    const base = target.split("#")[0];
    if (entry.key === "users") return path === "/admin" && !tab;
    if (query) return path === base && query === `tab=${tab}`;
    if (entry.href.includes("#")) return false;
    // /admin/workspaces/billing must not light up Workspaces as well.
    if (entry.key === "workspaces") return path === base || (path.startsWith(`${base}/`) && !path.startsWith("/admin/workspaces/billing"));
    return path === base || path.startsWith(`${base}/`);
  };

  const visible = ENTRIES.filter((e) => access[e.group]);
  return (
    <ul className="flex flex-wrap gap-1">
      {visible.map((entry) => {
        const current = isCurrent(entry);
        return (
          <li key={entry.key}>
            {/* A plain link: some sections are served by Office's part of the app, so it is a page load. */}
            <a
              href={`/${locale}${entry.href}`}
              aria-current={current ? "page" : undefined}
              className={
                current
                  ? "bg-suliko-default-color inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-white pointer-coarse:h-11"
                  : "text-foreground hover:bg-accent inline-flex h-9 items-center rounded-md px-3 text-sm font-medium pointer-coarse:h-11"
              }
            >
              {labels[entry.key] ?? entry.key}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  locale: string;
  access: { translate: boolean; office: boolean };
  labels: Record<string, string>;
}

/**
 * The one admin console's navigation, above every admin screen whichever part
 * of the app serves it. Each entry shows only for someone who passes its check.
 */
export function AdminSectionNav(props: Props) {
  if (!props.access.translate && !props.access.office) return null;
  return (
    <nav aria-label={props.labels.nav ?? "Admin"} className="border-border mb-4 border-b pb-3">
      <Suspense fallback={null}>
        <Items {...props} />
      </Suspense>
    </nav>
  );
}
