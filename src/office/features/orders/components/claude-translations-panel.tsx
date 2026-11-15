"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, ExternalLink, Loader2, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ClaudeJob, ClaudeJobList, ClaudeJobStatus } from "@office/features/orders/claude";
import {
  cancelClaudeJobAction,
  loadClaudeJobsAction,
  retryClaudeJobAction,
} from "@office/features/orders/claude-actions";
import {
  ClaudeTranslateDialog,
  type ClaudeDocument,
} from "@office/features/orders/components/claude-translate-dialog";
import { workspaceHref } from "@office/features/orders/components/order-files";
import { Link } from "@office/i18n/navigation";
import { Badge } from "@office/shared/components/ui/badge";
import { Button } from "@office/shared/components/ui/button";
import { formatDateTime } from "@office/shared/lib/dates";
import { cn } from "@office/shared/lib/utils";

/** How often the list is asked for while any job is waiting or running. */
const POLL_MS = 12_000;

const isActive = (status: ClaudeJobStatus) => status === "queued" || status === "translating";

const STATUS_STYLE: Record<ClaudeJobStatus, string> = {
  queued: "bg-hue-blue-tint text-hue-blue-ink",
  translating: "bg-hue-violet-tint text-hue-violet-ink",
  translated: "bg-hue-green-tint text-hue-green-ink",
  failed: "bg-hue-red-tint text-hue-red-ink",
  cancelled: "bg-muted text-muted-foreground",
};

/**
 * The order's Claude translations: one row per file, with its status, when it
 * last moved, how many times it was tried, why it failed, and a link to the
 * Word document once it exists.
 *
 * "Translated" means a draft for the translator, not a finished certified
 * document; the order's own status is never changed from here. While any job
 * waits or runs the list refreshes by itself; when one finishes the page is
 * refreshed too, so the new file shows in the Files card above.
 */
export function ClaudeTranslationsPanel({
  orderId,
  documents,
  canWrite,
  initial,
  timezone,
}: {
  orderId: number;
  documents: ClaudeDocument[];
  canWrite: boolean;
  initial: ClaudeJobList;
  timezone: string;
}) {
  const t = useTranslations("claudeTranslate");
  const router = useRouter();
  const [list, setList] = useState<ClaudeJobList>(initial);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const known = useRef(new Map(initial.jobs.map((job) => [job.id, job.status])));

  const apply = useCallback(
    (next: ClaudeJobList) => {
      // A job that was running and now has a result: the Files card has a new file.
      const finished = next.jobs.some(
        (job) => job.status === "translated" && known.current.get(job.id) !== "translated",
      );
      known.current = new Map(next.jobs.map((job) => [job.id, job.status]));
      setList(next);
      if (finished) router.refresh();
    },
    [router],
  );

  const reload = useCallback(async () => {
    try {
      const result = await loadClaudeJobsAction(orderId);
      if (result.ok) apply({ jobs: result.jobs, worker_online: result.worker_online, worker_last_seen: result.worker_last_seen });
      else setError(result.error);
    } catch {
      // A failed refresh is not news; the next one tries again.
    }
  }, [apply, orderId]);

  const anyActive = list.jobs.some((job) => isActive(job.status));
  useEffect(() => {
    if (!anyActive) return;
    const timer = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(timer);
  }, [anyActive, reload]);

  async function act(job: ClaudeJob, action: "retry" | "cancel") {
    setError(null);
    setBusy((current) => new Set(current).add(job.id));
    try {
      const result =
        action === "retry"
          ? await retryClaudeJobAction(orderId, job.id)
          : await cancelClaudeJobAction(orderId, job.id);
      if (!result.ok) {
        setError(result.error);
        // The job moved on while the panel was open: show where it is now.
        await reload();
        return;
      }
      await reload();
    } catch {
      setError(t("errors.unavailable"));
    } finally {
      setBusy((current) => {
        const next = new Set(current);
        next.delete(job.id);
        return next;
      });
    }
  }

  const waiting = list.jobs.some((job) => job.status === "queued");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-6">
        <p className="text-muted-foreground text-xs">{t("panelHint")}</p>
        {canWrite && (
          <ClaudeTranslateDialog
            orderId={orderId}
            documents={documents}
            onStarted={() => void reload()}
          />
        )}
      </div>

      {waiting && !list.worker_online && (
        <p className="border-hue-amber-ink/30 bg-hue-amber-tint mx-6 flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
          <AlertTriangle className="text-hue-amber-ink mt-0.5 size-4 shrink-0" aria-hidden />
          {t("workerOffline")}
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive px-6 text-sm">
          {error}
        </p>
      )}

      {list.jobs.length === 0 ? (
        <p className="text-muted-foreground px-6 pb-6 text-sm">{t("empty")}</p>
      ) : (
        <ul className="divide-border border-border divide-y border-t" aria-live="polite">
          {list.jobs.map((job) => {
            const working = busy.has(job.id);
            const when = job.finished_at ?? job.started_at ?? job.created_at;
            return (
              <li key={job.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={job.file_name}>
                    {job.file_name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    <span className="uppercase">
                      {job.source_language} → {job.target_language}
                    </span>
                    {" · "}
                    {formatDateTime(when, timezone)}
                    {job.attempts > 0 && ` · ${t("attempts", { count: job.attempts })}`}
                  </p>
                  {job.error && (job.status === "failed" || job.status === "queued") && (
                    <p className="text-hue-red-ink mt-0.5 text-xs">{job.error}</p>
                  )}
                </div>

                <Badge className={cn("border-transparent", STATUS_STYLE[job.status])}>
                  {job.status === "translating" && <Loader2 className="animate-spin" />}
                  {t(`status.${job.status}`)}
                </Badge>

                <div className="flex items-center gap-1">
                  {job.status === "translated" && job.result_file_id && job.document_id && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={workspaceHref(orderId, job.document_id, job.result_file_id)}>
                        <ExternalLink /> {t("open")}
                      </Link>
                    </Button>
                  )}
                  {canWrite && job.status === "failed" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={working}
                      onClick={() => void act(job, "retry")}
                    >
                      {working ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                      {t("retry")}
                    </Button>
                  )}
                  {canWrite && job.status === "queued" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={working}
                      onClick={() => void act(job, "cancel")}
                    >
                      {working ? <Loader2 className="animate-spin" /> : <X />}
                      {t("cancel")}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
