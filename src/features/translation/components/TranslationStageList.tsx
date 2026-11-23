"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { JobStage } from "../types/types.Translation";

/**
 * The stages a job actually passes through, in order, as the backend reports
 * them. `ready` and `failed` are terminal and are not rendered as steps —
 * reaching `ready` completes the last one.
 *
 * This replaces a five-item list the client invented (Uploading, Queued,
 * Analyzing, Translating, Finalizing) whose current index was derived from
 * progress thresholds of 10/25/50/85 — and `progress` was itself partly a
 * simulated curve, so the steps advanced on a timer rather than on anything
 * the job had done.
 *
 * "verifying" is not a step any more: the accuracy check now runs after the
 * translation is delivered and reports through the suggestions, so a job never
 * reports it. Jobs that stored it before still render, as the translating step.
 */
const STEPS = ["queued", "translating", "rebuilding"] as const;
type Step = (typeof STEPS)[number];

const stepIndex = (stage: JobStage): number => {
  if (stage === "ready") return STEPS.length;
  if (stage === "verifying") return STEPS.indexOf("translating");
  const i = STEPS.indexOf(stage as Step);
  return i === -1 ? 0 : i;
};

interface Props {
  /** Null for jobs created before the backend reported stages. */
  stage: JobStage | null;
  /** A line under the active step, such as "Section 3 of 6". */
  detail?: string | null;
  className?: string;
}

/**
 * Renders nothing when the stage is unknown, so callers can keep their old
 * progress-derived UI as the fallback for pre-deploy jobs rather than showing
 * two competing accounts of the same job.
 */
export default function TranslationStageList({ stage, detail, className }: Props) {
  const t = useTranslations("Translation.stage");
  if (!stage) return null;

  const failed = stage === "failed";
  const current = failed ? -1 : stepIndex(stage);

  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {STEPS.map((step, i) => {
        const done = !failed && i < current;
        const active = !failed && i === current;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "flex size-[18px] shrink-0 items-center justify-center rounded-full",
                done && "bg-emerald-600/10 text-emerald-600",
                active && "text-accent-text",
                !done && !active && "border-[1.5px] border-muted-foreground/40 opacity-50"
              )}
            >
              {done && <Check className="size-3.5" strokeWidth={3} />}
              {active && <Loader2 className="size-[18px] animate-spin" />}
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "text-sm",
                  active && "font-semibold text-foreground",
                  done && "text-muted-foreground",
                  !done && !active && "text-muted-foreground opacity-60"
                )}
              >
                {t(step)}
              </span>
              {active && detail && (
                <span className="text-xs text-muted-foreground" aria-live="polite">{detail}</span>
              )}
            </span>
          </li>
        );
      })}

      {/* Terminal states are not steps, but the list should still say so. */}
      {(stage === "ready" || failed) && (
        <li className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "flex size-[18px] shrink-0 items-center justify-center rounded-full",
              failed ? "text-destructive" : "bg-emerald-600/10 text-emerald-600"
            )}
          >
            {failed ? <X className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span className={cn("text-sm font-semibold", failed ? "text-destructive" : "text-foreground")}>
            {t(failed ? "failed" : "ready")}
          </span>
        </li>
      )}
    </ol>
  );
}
