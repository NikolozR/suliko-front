"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { ArrowDownUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { ToggleChip } from "@office/shared/components/form/toggle-chip";
import { cn } from "@office/shared/lib/utils";
import { withBasePath } from "@office/shared/lib/base-path";

/** The API's file route, which the browser asks with its own session. */
export const fileHref = (orderId: number, documentId: number, fileId: string) =>
  withBasePath(`/api/files/${orderId}/${documentId}/${encodeURIComponent(fileId)}`);

/** Start a download of a file the API sends as an attachment. */
export function startDownload(href: string, name?: string) {
  const link = document.createElement("a");
  link.href = href;
  if (name) link.download = name;
  link.rel = "noopener";
  link.click();
}

/** A bordered side of the workspace, with its title and what can be done to it. */
export function Pane({
  title,
  detail,
  actions,
  hidden,
  className,
  children,
}: {
  title: string;
  detail?: string;
  actions?: React.ReactNode;
  /** Below lg, where only one pane shows. From lg both always do. */
  hidden?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-card border-border flex min-h-0 flex-col overflow-hidden rounded-lg border",
        hidden && "max-lg:hidden",
        className,
      )}
    >
      <header className="border-border flex items-center gap-2 border-b px-3 py-1.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {detail && (
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs" title={detail}>
            {detail}
          </span>
        )}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-0.5">{actions}</div>}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-sm">
      {children}
    </div>
  );
}

/**
 * The "Sync scroll" switch. Off and unavailable while the original cannot be
 * followed (a PDF the browser's own viewer shows), and said so.
 */
export function SyncToggle({
  synced,
  available,
  onChange,
  className,
}: {
  synced: boolean;
  available: boolean;
  onChange: (on: boolean) => void;
  className?: string;
}) {
  const t = useTranslations("files.workspace");
  return (
    <ToggleChip
      pressed={synced && available}
      disabled={!available}
      onClick={() => onChange(!synced)}
      title={available ? t("syncHint") : t("syncUnavailable")}
      className={cn("flex h-8 items-center gap-1.5 px-3 text-xs font-medium", className)}
    >
      <ArrowDownUp className="size-3.5" aria-hidden />
      {t("sync")}
    </ToggleChip>
  );
}
