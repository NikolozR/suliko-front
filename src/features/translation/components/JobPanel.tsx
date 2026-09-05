"use client";

import { useTranslations } from "next-intl";
import { Check, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/utils";

/**
 * The right-hand job panel on /document: what the translation will produce,
 * whether names are confirmed first, and what it costs.
 *
 * The three blocks are presentational on purpose — DocumentTranslationCard owns
 * the form, the store and the submit path. The quote's CTA is a real submit
 * button inside that form when the balance covers the job, and a link to /price
 * when it does not, so the click can never fail after the fact.
 */

/** API `OutputFormat` values, named by what the user actually receives. */
export const DELIVERABLES = [
  { format: 6, titleKey: "pdfTitle", descKey: "pdfDesc" },
  { format: 5, titleKey: "wordTitle", descKey: "wordDesc" },
  { format: 2, titleKey: "textTitle", descKey: "textDesc" },
] as const;

function PanelCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-background p-5", className)}>
      {children}
    </div>
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
      {children}
    </span>
  );
}

interface DeliverableProps {
  value: number;
  onChange: (format: number) => void;
}

/**
 * Replaces a bare Select of "HTML / Rich PDF / Markdown", which exposed the API
 * enum values as user-facing names and did not match the formats offered at the
 * download step.
 */
export function DeliverableSelect({ value, onChange }: DeliverableProps) {
  const t = useTranslations("DocumentTranslationCard.deliverable");

  return (
    <PanelCard>
      <MicroLabel>{t("label")}</MicroLabel>
      <div role="radiogroup" aria-label={t("label")} className="flex flex-col gap-2.5">
        {DELIVERABLES.map(({ format, titleKey, descKey }) => {
          const selected = value === format;
          return (
            <button
              key={format}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(format)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[10px] border p-3.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50",
                selected
                  ? "border-[1.5px] border-suliko-default-color bg-suliko-default-color/[0.04]"
                  : "border-border hover:bg-muted/60"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 size-[18px] shrink-0 rounded-full border transition-colors",
                  selected
                    ? "border-[5px] border-suliko-default-color"
                    : "border-[1.5px] border-muted-foreground/50"
                )}
              />
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-snug">{t(titleKey)}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                  {t(descKey)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </PanelCard>
  );
}

interface NamesProps {
  enabled: boolean;
  onToggle: () => void;
  /** Present only inside a project, where a glossary is already saved. */
  savedCount?: number;
  projectName?: string | null;
  projectId?: string | null;
}

/**
 * Was a 22px unlabelled switch explained by a `title=` attribute — invisible on
 * touch, unreachable by keyboard, and hidden entirely inside a project, where
 * the glossary was applied silently.
 */
export function NamesBlock({ enabled, onToggle, savedCount, projectName, projectId }: NamesProps) {
  const t = useTranslations("DocumentTranslationCard.names");

  return (
    <PanelCard>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug">{t("title")}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t("body")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t("title")}
          onClick={onToggle}
          className={cn(
            "relative mt-0.5 inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50",
            enabled ? "bg-suliko-default-color" : "bg-muted-foreground/35"
          )}
        >
          <span
            className={cn(
              "inline-block size-6 rounded-full bg-white shadow-sm transition-transform",
              enabled ? "translate-x-[25px]" : "translate-x-[3px]"
            )}
          />
        </button>
      </div>

      {typeof savedCount === "number" && projectName && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
            <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
            <span className="truncate">{t("savedCount", { count: savedCount, project: projectName })}</span>
          </span>
          {projectId && (
            <Link
              href={`/projects/${projectId}`}
              className="shrink-0 text-[13px] font-semibold text-suliko-default-color hover:underline"
            >
              {t("editGlossary")}
            </Link>
          )}
        </div>
      )}
    </PanelCard>
  );
}

interface QuoteProps {
  /** Authoritative page count, or null while it is still being read. */
  pageCount: number | null;
  balance: number;
  /** Rendered inside the block; owns loading/disabled state. */
  submitLabel: string;
  onSubmitDisabled: boolean;
  etaMin: number;
  etaMax: number;
}

/**
 * The gating number used to live in a different unit, in a different colour, at
 * the far end of the sidebar from the decision it governed — and the balance
 * check ran in `onSubmit`, after the user had already committed.
 *
 * Here the arithmetic is shown before the click, and when the balance is short
 * the CTA becomes a top-up link rather than a button that fails.
 */
export function QuoteBlock({
  pageCount,
  balance,
  submitLabel,
  onSubmitDisabled,
  etaMin,
  etaMax,
}: QuoteProps) {
  const t = useTranslations("DocumentTranslationCard.quote");

  const resolved = pageCount !== null;
  const available = Math.floor(balance);
  const shortBy = resolved ? Math.max(0, pageCount - available) : 0;
  const isShort = resolved && shortBy > 0;
  const leftAfter = resolved ? available - pageCount : 0;

  const figure = (v: React.ReactNode) =>
    resolved ? v : <span className="inline-block h-4 w-10 animate-pulse rounded bg-white/20" />;

  return (
    <div className="rounded-xl bg-[#14161d] p-5 text-white">
      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/70">{t("thisDocument")}</dt>
          <dd className="tabular-nums">{figure(pageCount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/70">{t("yourBalance")}</dt>
          <dd className="tabular-nums">{available}</dd>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
          <dt className="text-white/70">{isShort ? t("pagesShort", { count: shortBy }) : t("leftAfter")}</dt>
          <dd
            className={cn(
              "font-bold tabular-nums",
              isShort ? "text-[#fca5a5]" : "text-[#7ee2b8]"
            )}
          >
            {figure(isShort ? `−${shortBy}` : leftAfter)}
          </dd>
        </div>
      </dl>

      {isShort ? (
        <Link
          href="/price"
          className="suliko-default-bg mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] text-base font-bold text-white transition-opacity hover:opacity-90"
        >
          <Wallet className="size-[18px]" aria-hidden />
          {t("topUpCta", { count: shortBy })}
        </Link>
      ) : (
        <button
          type="submit"
          disabled={onSubmitDisabled || !resolved}
          className="suliko-default-bg mt-4 flex h-[52px] w-full items-center justify-center rounded-[10px] text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resolved ? submitLabel : t("counting")}
        </button>
      )}

      <p className="mt-2.5 text-center text-[13px] text-white/55">
        {resolved ? t("usuallyReady", { min: etaMin, max: etaMax }) : " "}
      </p>
    </div>
  );
}
