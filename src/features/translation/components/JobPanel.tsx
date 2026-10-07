"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Wallet, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/utils";
import type { DocumentAnalysis, TermTranslationItem } from "../types/types.Translation";
import type { AnalysisStatus } from "../hooks/useDocumentAnalysis";

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

interface BriefProps {
  status: AnalysisStatus;
  analysis: DocumentAnalysis | null;
  /** The user's working copy of analysis.terms. */
  terms: TermTranslationItem[];
  onTermChange: (index: number, translation: string) => void;
  onTermRemove: (index: number) => void;
  /** Keyed by question index. */
  answers: Record<number, string>;
  onAnswer: (index: number, answer: string) => void;
}

/** How many terms show before "show all"; the panel is 392px wide. */
const TERMS_PREVIEW = 5;

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[12px] text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * What the document turned out to be, read before anything is paid for: the
 * terms whose rendering is fixed up front, and the few questions only the user
 * can answer. Everything here is optional; translating without touching it
 * works exactly as before.
 */
export function BriefBlock({
  status,
  analysis,
  terms,
  onTermChange,
  onTermRemove,
  answers,
  onAnswer,
}: BriefProps) {
  const t = useTranslations("DocumentTranslationCard.brief");
  const [showAllTerms, setShowAllTerms] = useState(false);

  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <PanelCard>
        <MicroLabel>{t("label")}</MicroLabel>
        <p className="text-[13px] text-muted-foreground" aria-live="polite">{t("reading")}</p>
        <div className="mt-3 flex flex-col gap-2" aria-hidden>
          <span className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <span className="h-3 w-full animate-pulse rounded bg-muted" />
          <span className="h-3 w-5/6 animate-pulse rounded bg-muted" />
        </div>
      </PanelCard>
    );
  }

  if (status === "failed" || !analysis) {
    return (
      <PanelCard>
        <MicroLabel>{t("label")}</MicroLabel>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{t("failed")}</p>
      </PanelCard>
    );
  }

  const { layout } = analysis;
  const visibleTerms = showAllTerms ? terms : terms.slice(0, TERMS_PREVIEW);

  return (
    <PanelCard>
      <MicroLabel>{t("label")}</MicroLabel>
      <h3 className="text-[15px] font-semibold leading-snug">{analysis.documentType ?? t("untitled")}</h3>
      {analysis.summary && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{analysis.summary}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {analysis.detectedSourceLanguage && <Chip>{t("writtenIn", { language: analysis.detectedSourceLanguage })}</Chip>}
        {analysis.register && <Chip>{analysis.register}</Chip>}
        {layout.tables > 0 && <Chip>{t("tables", { count: layout.tables })}</Chip>}
        {layout.hasStamps && <Chip>{t("stamps")}</Chip>}
        {layout.hasSignatures && <Chip>{t("signatures")}</Chip>}
        {layout.hasHandwriting && <Chip>{t("handwriting")}</Chip>}
        {layout.isScanned && <Chip>{t("scanned")}</Chip>}
        {analysis.names.length > 0 && <Chip>{t("names", { count: analysis.names.length })}</Chip>}
      </div>

      {terms.length > 0 && (
        <div className="mt-4 border-t border-border pt-3.5">
          <h4 className="text-[13px] font-semibold">{t("termsTitle")}</h4>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{t("termsBody")}</p>
          <ul className="mt-2.5 flex flex-col gap-2">
            {visibleTerms.map((term, index) => (
              <li key={`${term.original}-${index}`} className="flex items-center gap-2">
                <span className="w-[38%] min-w-0 truncate text-[13px]" title={term.note ?? term.original}>
                  {term.original}
                </span>
                <span aria-hidden className="text-muted-foreground">→</span>
                <input
                  value={term.translation}
                  onChange={(e) => onTermChange(index, e.target.value)}
                  aria-label={t("termInput", { term: term.original })}
                  className={cn(
                    "h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-[13px]",
                    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50"
                  )}
                />
                <button
                  type="button"
                  onClick={() => onTermRemove(index)}
                  aria-label={t("removeTerm", { term: term.original })}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {terms.length > TERMS_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAllTerms((v) => !v)}
              className="mt-2 text-[13px] font-semibold text-suliko-default-color hover:underline"
            >
              {showAllTerms ? t("showFewer") : t("showAll", { count: terms.length })}
            </button>
          )}
        </div>
      )}

      {analysis.questions.length > 0 && (
        <div className="mt-4 border-t border-border pt-3.5">
          <h4 className="text-[13px] font-semibold">{t("questionsTitle")}</h4>
          <ol className="mt-2.5 flex flex-col gap-3.5">
            {analysis.questions.map((question, index) => {
              const answer = answers[index] ?? "";
              const isOption = question.options.includes(answer);
              return (
                <li key={index}>
                  <p className="text-[13px] leading-relaxed">{question.question}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={question.question}>
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={answer === option}
                        onClick={() => onAnswer(index, answer === option ? "" : option)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[12px] transition-colors",
                          answer === option
                            ? "border-suliko-default-color bg-suliko-default-color/10 font-semibold text-foreground"
                            : "border-border text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <input
                    value={isOption ? "" : answer}
                    onChange={(e) => onAnswer(index, e.target.value)}
                    placeholder={t("ownAnswer")}
                    aria-label={t("ownAnswerFor", { question: question.question })}
                    className={cn(
                      "mt-2 h-8 w-full rounded-md border border-border bg-background px-2 text-[13px]",
                      "placeholder:text-muted-foreground/70",
                      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50"
                    )}
                  />
                </li>
              );
            })}
          </ol>
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
  const nearLimit = value.length > MAX_INSTRUCTIONS_LENGTH * 0.9;

  return (
    <PanelCard>
      <label htmlFor="translator-instructions" className="block text-[15px] font-semibold leading-snug">
        {t("title")}
      </label>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t("body")}</p>
      <textarea
        id="translator-instructions"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_INSTRUCTIONS_LENGTH}
        rows={3}
        placeholder={t("placeholder")}
        className={cn(
          "mt-3 w-full resize-y rounded-[10px] border border-border bg-background px-3 py-2.5 text-[14px] leading-relaxed",
          "placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50"
        )}
      />
      {nearLimit && (
        <p className="mt-1 text-right text-[12px] tabular-nums text-muted-foreground">
          {value.length}/{MAX_INSTRUCTIONS_LENGTH}
        </p>
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
          className="suliko-default-bg relative mt-4 flex h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-[10px] px-4 text-base font-bold leading-tight text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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
          <span className="relative">{resolved ? submitLabel : pendingLabel ?? t("counting")}</span>
        </button>
      )}

      <p className="mt-2.5 text-center text-[13px] text-white/55">
        {resolved && !busy ? t("usuallyReady", { min: etaMin, max: etaMax }) : " "}
      </p>

      {/* Announced, not painted — the button already shows this text. */}
      <span aria-live="polite" className="sr-only">
        {busy ? submitLabel : ""}
      </span>
    </div>
  );
}
