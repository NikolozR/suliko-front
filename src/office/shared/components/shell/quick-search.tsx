"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  ArrowRight,
  FileText,
  Loader2,
  Plus,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  quickSearchAction,
  type QuickSearchResult,
} from "@office/features/search/actions";
import { useRouter } from "@office/i18n/navigation";
import type { Permission } from "@office/shared/auth/permissions";
import { type Plan, planAllows } from "@office/shared/auth/plans";
import { startNavigationProgress } from "@office/shared/components/shell/navigation-progress";
import { StatusBadge } from "@office/shared/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@office/shared/components/ui/dialog";
import { NAVIGATION } from "@office/shared/config/navigation";
import { readRecentOrders, type RecentOrder } from "@office/shared/lib/recent-orders";
import { cn } from "@office/shared/lib/utils";

const DEBOUNCE_MS = 250;
const EMPTY: QuickSearchResult = { orders: [], clients: [] };

interface Item {
  key: string;
  href: string;
  icon: ReactNode;
  label: string;
  detail?: ReactNode;
}

/**
 * Ctrl+K (Cmd+K on a Mac): jump to an order, a client or a screen.
 *
 * Screens are matched here, by their label in the current language; orders
 * and clients go to the API through one server action, a quarter-second
 * after typing stops. Arrow keys move, Enter opens. Typing an order number
 * finds that order, since the order search matches ids.
 *
 * Before anything is typed it is not empty: the last orders opened in this
 * browser, and the two things most often started from here, a new order and
 * a new client.
 */
export function QuickSearch({
  open,
  onOpenChange,
  permissions,
  plan,
  scope,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: readonly Permission[];
  plan: Plan;
  /** The organisation's slug: recently opened orders are kept per organisation. */
  scope: string;
}) {
  const t = useTranslations("shell.search");
  const tShell = useTranslations("shell");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QuickSearchResult>(EMPTY);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [pending, startTransition] = useTransition();
  const latest = useRef("");

  // A fresh box each time it opens, with the orders opened since last time.
  useEffect(() => {
    if (open) {
      setQuery("");
      setResult(EMPTY);
      setActive(0);
      setRecent(
        permissions.includes("orders.read") ? readRecentOrders(scope) : [],
      );
    }
  }, [open, scope, permissions]);

  useEffect(() => {
    const trimmed = query.trim();
    latest.current = trimmed;
    if (!trimmed) {
      setResult(EMPTY);
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const found = await quickSearchAction(trimmed);
        // Only the answer to what is in the box now; a slow earlier reply
        // must not overwrite a newer one.
        if (latest.current === trimmed) {
          setResult(found);
          setActive(0);
        }
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const screens = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return [];
    return NAVIGATION.flatMap((section) => section.items)
      .filter(
        (item) =>
          (!item.permission || permissions.includes(item.permission)) &&
          (!item.feature || planAllows(plan, item.feature)),
      )
      .filter((item) =>
        tNav(item.labelKey).toLocaleLowerCase().includes(needle),
      );
  }, [query, permissions, plan, tNav]);

  const typed = query.trim() !== "";

  // What the box offers before anything is typed.
  const starters: { title: string; items: Item[] }[] = [
    {
      title: t("recent"),
      items: recent.map((order) => ({
        key: `recent-${order.id}`,
        href: `/translations/${order.id}`,
        icon: <FileText className="size-4" />,
        label: `#${order.number} · ${order.clientName}`,
      })),
    },
    {
      title: t("actions"),
      items: [
        ...(permissions.includes("orders.write")
          ? [
              {
                key: "action-new-order",
                href: "/translations/new",
                icon: <Plus className="size-4" />,
                label: tShell("newOrder"),
              },
            ]
          : []),
        ...(permissions.includes("clients.write")
          ? [
              {
                key: "action-new-client",
                href: "/clients/new",
                icon: <UserPlus className="size-4" />,
                label: t("newClient"),
              },
            ]
          : []),
      ],
    },
  ];

  const found: { title: string; items: Item[] }[] = [
    {
      title: t("screens"),
      items: screens.map((item) => {
        const Icon = item.icon;
        return {
          key: `screen-${item.href}`,
          href: `/${item.href}`,
          icon: <Icon className="size-4" />,
          label: tNav(item.labelKey),
        };
      }),
    },
    {
      title: t("orders"),
      items: result.orders.map((order) => ({
        key: `order-${order.id}`,
        href: `/translations/${order.id}`,
        icon: <FileText className="size-4" />,
        label: `#${order.number} · ${order.clientName}`,
        detail: <StatusBadge status={order.status} />,
      })),
    },
    {
      title: t("clients"),
      items: result.clients.map((client) => ({
        key: `client-${client.id}`,
        href: `/clients/${client.id}`,
        icon: <UsersRound className="size-4" />,
        label: client.name,
        detail: client.detail ? (
          <span className="text-muted-foreground text-xs">{client.detail}</span>
        ) : undefined,
      })),
    },
  ];

  const groups = (typed ? found : starters).filter(
    (group) => group.items.length > 0,
  );

  const flat = groups.flatMap((group) => group.items);

  const go = (item: Item) => {
    onOpenChange(false);
    startNavigationProgress();
    router.push(item.href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (flat.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % flat.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + flat.length) % flat.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flat[Math.min(active, flat.length - 1)];
      if (item) go(item);
    }
  };

  // Keep the highlighted row in view as the arrows move it.
  useEffect(() => {
    document
      .getElementById(`quick-search-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let index = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <div className="border-border flex items-center gap-2 border-b px-3">
          {pending ? (
            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
          ) : (
            <Search className="text-muted-foreground size-4 shrink-0" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("placeholder")}
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="quick-search-results"
            aria-activedescendant={
              flat.length > 0 ? `quick-search-${active}` : undefined
            }
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
          <kbd className="text-muted-foreground border-border hidden rounded border px-1.5 text-xs sm:inline">
            Esc
          </kbd>
        </div>

        <div
          id="quick-search-results"
          role="listbox"
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {typed && flat.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              {pending ? t("searching") : t("nothing")}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.title} className="mb-2 last:mb-0">
                <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  index += 1;
                  const position = index;
                  const selected = position === active;
                  return (
                    <button
                      key={item.key}
                      id={`quick-search-${position}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseMove={() => setActive(position)}
                      onClick={() => go(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm",
                        selected
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground",
                      )}
                    >
                      <span className="text-muted-foreground shrink-0">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.detail && (
                        <span className="shrink-0">{item.detail}</span>
                      )}
                      {selected && (
                        <ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
          {/* What can be typed, under the starters; all there is to show to
              someone who may neither open orders nor add anything. */}
          {!typed && (
            <p
              className={cn(
                "text-muted-foreground px-2 text-xs",
                flat.length === 0
                  ? "py-6 text-center text-sm"
                  : "border-border mt-1 border-t pt-3 pb-1",
              )}
            >
              {t("hint")}
            </p>
          )}
        </div>

        {/* The keys that work in the box, for the first time someone opens it. */}
        <div className="border-border text-muted-foreground bg-muted/30 hidden items-center gap-4 border-t px-3 py-2 text-xs sm:flex">
          {[
            ["↑ ↓", t("keyMove")],
            ["Enter", t("keyOpen")],
            ["Esc", t("keyClose")],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <kbd className="border-border bg-background rounded border px-1.5 py-0.5 text-xs">
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
