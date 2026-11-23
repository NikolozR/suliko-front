"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { getStatus } from "../services/jobService";

/**
 * Tells the customer when part of a finished translation was done by the backup
 * model, because the main one was overloaded. These are often certified
 * documents, so a quiet quality difference is not something to hide.
 *
 * The count is kept on the job after it completes, so this asks for it once.
 * Any failure shows nothing: the note is extra information, never a reason to
 * stand between the person and their translation.
 */
export default function BackupModelNote({ jobId }: { jobId: string | null | undefined }) {
  const t = useTranslations("DocumentTranslationCard.inProgress");
  const [used, setUsed] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    getStatus(jobId)
      .then((status) => {
        if (!cancelled) setUsed((status.backupSections ?? 0) > 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (!used) return null;

  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p>{t("backupNote")}</p>
    </div>
  );
}
