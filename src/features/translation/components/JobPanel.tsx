"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CircleHelp, Plus, Wallet } from "lucide-react";
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

/**
 * API `OutputFormat` values, named by what the user actually receives.
 *
 * 6 (RichPdf) and 5 (Html) differ in the prompt the backend builds:
 * BuildFileUriTranslationPromptRichHtml asks the model to reconstruct colours,
 * tables and emphasis, which costs time; the plain variant does not. Format 2
 * (Markdown) is a developer-testing output and is deliberately not offered.
 */
export const DELIVERABLES = [
  { format: 6, titleKey: "richTitle", descKey: "richDesc" },
  { format: 5, titleKey: "plainTitle", descKey: "plainDesc" },
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
    <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
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
  const current = DELIVERABLES.find((d) => d.format === value) ?? DELIVERABLES[0];

  return (
    <PanelCard className="p-4">
      <MicroLabel>{t("label")}</MicroLabel>
      <div role="radiogroup" aria-label={t("label")} className="flex gap-1 rounded-xl bg-muted p-1">
        {DELIVERABLES.map(({ format, titleKey }) => {
          const selected = value === format;
          return (
            <button
              key={format}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(format)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,box-shadow,color] duration-150",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50",
                selected
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(titleKey)}
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-[13px] leading-snug text-muted-foreground" aria-live="polite">
        {t(current.descKey)}
      </p>
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
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <PanelCard className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* h5, not h3: see the brief's title below. */}
          <h5 className="text-[15px] font-semibold leading-snug">{t("title")}</h5>
          <button
            type="button"
            onClick={() => setInfoOpen((value) => !value)}
            aria-expanded={infoOpen}
            aria-controls="names-info"
            aria-label={t("moreInfo")}
            className="relative text-muted-foreground hover:text-foreground before:absolute before:-inset-3 before:content-['']"
          >
            <CircleHelp className="size-4" aria-hidden />
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t("title")}
          onClick={onToggle}
          className={cn(
            "relative mt-0.5 inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full transition-colors",
            // The look stays 30px; the tappable area is 44px.
            "before:absolute before:inset-x-0 before:-inset-y-[7px] before:content-['']",
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
      {infoOpen && (
        <p id="names-info" className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          {t("body")}
        </p>
      )}

      {typeof savedCount === "number" && projectName && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
            <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
            <span className="truncate">{t("savedCount", { count: savedCount, project: projectName })}</span>
          </span>
          {projectId && (
            <Link
              href={`/projects/${projectId}`}
              className="shrink-0 text-[13px] font-semibold text-accent-text hover:underline"
            >
              {t("editGlossary")}
            </Link>
          )}
        </div>
      )}
    </PanelCard>
  );
}

/** Mirrors the backend's cap on translate-with-uri, which rejects anything longer. */
export const MAX_INSTRUCTIONS_LENGTH = 4000;

interface InstructionsProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Free-text notes that go into the translation prompt and to the review that
 * follows it, so "keep company names in English" is both followed and not
 * flagged afterwards as untranslated text.
 */
export function InstructionsBlock({ value, onChange }: InstructionsProps) {
  const t = useTranslations("DocumentTranslationCard.instructions");
  const [open, setOpen] = useState(value.length > 0);
  const nearLimit = value.length > MAX_INSTRUCTIONS_LENGTH * 0.9;

  return (
    <PanelCard className="p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="translator-instructions-panel"
        className="flex w-full items-center gap-2 text-left text-[15px] font-semibold leading-snug focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50"
      >
        <Plus
          className={cn("size-4 text-accent-text transition-transform duration-150", open && "rotate-45")}
          aria-hidden
        />
        {t("title")}
      </button>
      {open && (
        <div id="translator-instructions-panel">
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{t("body")}</p>
          <textarea
            id="translator-instructions"
            aria-label={t("title")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={MAX_INSTRUCTIONS_LENGTH}
            rows={3}
            placeholder={t("placeholder")}
            className={cn(
              "mt-3 w-full resize-y rounded-[10px] border border-border bg-background px-3 py-2.5 text-base leading-relaxed md:text-[14px]",
              "placeholder:text-muted-foreground/70",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50"
            )}
          />
          {nearLimit && (
            <p className="mt-1 text-right text-[12px] tabular-nums text-muted-foreground">
              {value.length}/{MAX_INSTRUCTIONS_LENGTH}
            </p>
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
  /** A submit is in flight — show a spinner and hold the ETA line. */
  busy?: boolean;
  /** 0-100 while bytes are going up, null at every other stage. */
  uploadPercent?: number | null;
  /**
   * Shown in place of the CTA label while the page count is still unknown —
   * the file is uploading and being measured. Falls back to "counting".
   */
  pendingLabel?: string | null;
  /**
   * False before any file is chosen. There is nothing to read or count yet, so
   * the figures stay as dashes and the button says what to do, instead of
   * showing placeholders and "Reading the page count…" as if work was running.
   */
  hasFile?: boolean;
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
  busy = false,
  uploadPercent = null,
  pendingLabel = null,
  hasFile = true,
}: QuoteProps) {
  const t = useTranslations("DocumentTranslationCard.quote");

  const resolved = pageCount !== null;
  const available = Math.floor(balance);
  const shortBy = resolved ? Math.max(0, pageCount - available) : 0;
  const isShort = resolved && shortBy > 0;
  const leftAfter = resolved ? available - pageCount : 0;

  const figure = (v: React.ReactNode) =>
    resolved ? (
      v
    ) : !hasFile ? (
      <span aria-hidden>–</span>
    ) : (
      <span className="inline-block h-4 w-8 animate-pulse rounded bg-white/20" />
    );

  return (
    // Pinned to the foot of the screen while the panel above it scrolls: the
    // button used to come after everything else, three screens down a long
    // brief. On a phone it sits on the bottom bar (4rem tall, under md).
    //
    // The outer box is the card's own colour, so what scrolls behind does not
    // show round the dark one, and fades out above it rather than being cut.
    <div
      className={cn(
        "sticky bottom-16 z-10 bg-card pb-2 pt-1 md:bottom-0 md:pb-4",
        "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-6",
        "before:bg-linear-to-t before:from-card before:to-transparent"
      )}
    >
      <div className="rounded-xl bg-[#14161d] p-4 text-white">
        {/* The figure over its name, so a name that wraps does not push the figures out of line. */}
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col-reverse justify-end gap-0.5">
            <dt className="text-[12px] leading-tight text-white/70">{t("thisDocument")}</dt>
            <dd className="text-[17px] font-semibold tabular-nums">{figure(pageCount)}</dd>
          </div>
          <div className="flex flex-col-reverse justify-end gap-0.5">
            <dt className="text-[12px] leading-tight text-white/70">{t("yourBalance")}</dt>
            <dd className="text-[17px] font-semibold tabular-nums">{available}</dd>
          </div>
          <div className="flex flex-col-reverse justify-end gap-0.5">
            <dt className="text-[12px] leading-tight text-white/70">
              {isShort ? t("pagesShort", { count: shortBy }) : t("leftAfter")}
            </dt>
            <dd
              className={cn(
                "text-[17px] font-semibold tabular-nums",
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
            className="suliko-default-bg mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Wallet className="size-[18px]" aria-hidden />
            {t("topUpCta", { count: shortBy })}
          </Link>
        ) : (
          <button
            type="submit"
            disabled={onSubmitDisabled || !resolved}
            className="suliko-default-bg relative mt-3 flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-[10px] px-4 text-base font-semibold leading-tight text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {/* A real fill, and only while real bytes are moving. Every other
                stage gets a spinner and a name — there is nothing honest to
                measure during a single opaque model call. */}
            {uploadPercent !== null && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-200 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            )}
            {busy && (
              <span
                aria-hidden
                className="relative size-[18px] shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
            )}
            <span className="relative">
              {resolved ? submitLabel : !hasFile ? t("chooseFile") : pendingLabel ?? t("counting")}
            </span>
          </button>
        )}

        {resolved && !busy && (
          <p className="mt-2 text-center text-[12px] text-white/55">{t("usuallyReady", { min: etaMin, max: etaMax })}</p>
        )}

        {/* Announced, not painted — the button already shows this text. */}
        <span aria-live="polite" className="sr-only">
          {busy ? submitLabel : ""}
        </span>
      </div>
    </div>
  );
}
