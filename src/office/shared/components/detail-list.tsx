// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { ReactNode } from "react";

import { cn } from "@office/shared/lib/utils";

/**
 * Label-over-value rows, the shape every detail screen uses.
 *
 * A missing value renders an em dash rather than nothing: a blank space where
 * a value should be reads as a layout bug, while "—" reads as "we do not have
 * this", which is the true statement.
 */
export function Detail({
  label,
  value,
  href,
  mono,
  className,
  children,
}: {
  label: string;
  /** Ignored when `children` is given. */
  value?: string | null;
  /** Renders the value as a link — `mailto:`, `tel:`, or a route. */
  href?: string;
  mono?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>
        {children ??
          (value ? (
            href ? (
              <a href={href} className="text-link hover:underline">
                {value}
              </a>
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground">–</span>
          ))}
      </dd>
    </div>
  );
}

/** The `<dl>` those rows go in. Two columns from `sm` up unless told otherwise. */
export function DetailList({
  columns = 2,
  className,
  children,
}: {
  columns?: 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <dl
      className={cn(
        "grid gap-5",
        columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        className,
      )}
    >
      {children}
    </dl>
  );
}
