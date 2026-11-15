// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";
import { cn } from "@office/shared/lib/utils";

/**
 * Offset pagination, rendered as real links.
 *
 * Server-rendered rather than a client component so the links are crawlable,
 * prefetchable and work with the back button — and so the whole table stays a
 * Server Component. Page state lives in the URL, which makes a filtered view
 * shareable, exactly as the list screens are specified.
 */

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  /** Current query params, minus `offset`, preserved across page links. */
  params: Record<string, string | undefined>;
  /** Route segment, e.g. "/clients". */
  basePath: string;
}

function hrefFor(
  basePath: string,
  params: Record<string, string | undefined>,
  offset: number,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  // Offset 0 is the default — leaving it out keeps the first page's URL clean.
  if (offset > 0) query.set("offset", String(offset));

  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ total, limit, offset, params, basePath }: PaginationProps) {
  const t = useTranslations("common");
  // Past the end (a stale link): still render, so there is a way back.
  if (total <= limit && offset === 0) return null;

  const currentPage = Math.floor(offset / limit) + 1;
  const pageCount = Math.ceil(total / limit);
  const hasPrevious = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="border-border flex items-center justify-between gap-4 border-t px-4 py-3">
      <p className="text-muted-foreground text-sm">
        {t("rangeOf", {
          from: Math.min(offset + 1, total),
          to: Math.min(offset + limit, total),
          total,
        })}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild={hasPrevious}
          disabled={!hasPrevious}
          aria-label={t("previousPage")}
        >
          {hasPrevious ? (
            <Link href={hrefFor(basePath, params, Math.max(0, offset - limit))}>
              <ChevronLeft />
            </Link>
          ) : (
            <span>
              <ChevronLeft />
            </span>
          )}
        </Button>

        <span className="text-muted-foreground min-w-20 text-center text-sm tabular-nums">
          {Math.min(currentPage, Math.max(pageCount, 1))} / {Math.max(pageCount, 1)}
        </span>

        <Button
          variant="outline"
          size="sm"
          asChild={hasNext}
          disabled={!hasNext}
          aria-label={t("nextPage")}
        >
          {hasNext ? (
            <Link href={hrefFor(basePath, params, offset + limit)}>
              <ChevronRight />
            </Link>
          ) : (
            <span>
              <ChevronRight />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

/** "Showing 20 of 688 clients" — the counter the production screens carry. */
export function ResultCount({
  shown,
  total,
  entity,
  className,
}: {
  shown: number;
  total: number;
  /** Already translated, e.g. t("clients.entity"). */
  entity?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium",
        className,
      )}
    >
      {t("showing", { shown, total })}
      {entity ? ` ${entity}` : ""}
    </span>
  );
}
