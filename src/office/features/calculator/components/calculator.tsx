"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, Check, ClipboardCopy, Copy, FilePlus2, Loader2, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { quoteAction, type QuoteInput } from "@office/features/calculator/actions";
import { saveQuoteDraft, type QuoteDraft } from "@office/features/calculator/draft";
import type {
  CopyType,
  HandoverMethod,
  QuoteLine,
  QuoteResponse,
  ReferenceData,
  Urgency,
} from "@office/features/calculator/types";
import { useRouter } from "@office/i18n/navigation";
import { selectClass } from "@office/shared/components/form/fields";
import { NotarisationFields } from "@office/features/orders/components/notarisation-fields";
import { copyTypeNotarises } from "@office/features/orders/copy-types";
import { PricingUnitToggle } from "@office/features/orders/components/pricing-unit-toggle";
import type { PricingUnit } from "@office/features/orders/pricing-unit";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { formatMoneyString } from "@office/shared/lib/money";
import { cn } from "@office/shared/lib/utils";

/**
 * Quick quote. Creates nothing.
 *
 * Prices through the API rather than in the browser, so the calculator, the
 * order builder and the invoice all agree — see `features/calculator/actions.ts`
 * for why that trade is made deliberately.
 *
 * Two ways out, both from the PHP office screen's habits: copy the quote as
 * text for a message to the client, or turn it into an order without typing
 * the documents again.
 */

interface DocumentRow {
  key: number;
  source_language: string;
  target_language: string;
  document_type_id: number;
  /** Text, so the box can be emptied while typing; restored to 1 on blur. */
  page_count: string;
  /** Characters with spaces, for a bureau that prices by characters; "" when none. */
  character_count: string;
  copy_type: CopyType;
  /** Null follows the copy type. */
  is_notarized: boolean | null;
}

function blankRow(key: number): DocumentRow {
  return {
    key,
    source_language: "",
    target_language: "",
    document_type_id: 0,
    page_count: "1",
    character_count: "",
    copy_type: "original",
    is_notarized: null,
  };
}

/** Characters typed on a row, or null: blank, or not a whole number. */
const charactersOf = (row: DocumentRow): number | null => {
  const value = Math.floor(Number(row.character_count.replace(/\s/g, "")));
  return Number.isFinite(value) && value > 0 ? value : null;
};
const pagesOf = (row: DocumentRow) => Math.max(1, Math.floor(Number(row.page_count)) || 1);

export function Calculator({
  reference,
  canCreateOrders = false,
  canSeeCosts = false,
}: {
  reference: ReferenceData;
  /** `orders.write` — shows "Create order from this quote". */
  canCreateOrders?: boolean;
  /** `reports.profit` — the internal cost and profit lines. */
  canSeeCosts?: boolean;
}) {
  const t = useTranslations("orders");
  const tc = useTranslations("calculator");
  const te = useTranslations("enums");
  const locale = useLocale();
  const router = useRouter();

  // Per-mount, so the server and the browser agree on the first row's ids.
  const nextKey = useRef(1);
  const [rows, setRows] = useState<DocumentRow[]>(() => [blankRow(0)]);
  // Express and urgent are not offered: every quote is standard.
  const [urgency] = useState<Urgency>("standard");
  const [handover, setHandover] = useState<HandoverMethod>("scan");
  // Pages or characters: the bureau's default to begin with, and the order
  // made from this quote is calculated the same way.
  const [unit, setUnit] = useState<PricingUnit>(reference.pricing_unit ?? "pages");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [rowLines, setRowLines] = useState<(QuoteLine | null)[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Express/urgent hidden for now — see the note by the "Delivery speed"
  // card below.

  const nameOf = useCallback(
    (item: { name_en: string; name_ka: string }) =>
      locale === "ka" ? item.name_ka || item.name_en : item.name_en || item.name_ka,
    [locale],
  );
  const enumLabel = (group: string, option: { value: string; label: string }) =>
    te.has(`${group}.${option.value}`) ? te(`${group}.${option.value}`) : option.label;

  /**
   * Every active language, not only pairs with a configured rate — an
   * unpriced pair still quotes, at the fallback rate, with a warning asking
   * for a manual price. See the same note in the order builder.
   */
  const sourceLanguages = reference.languages;
  const targetsFor = useCallback(
    (source: string) => reference.languages.filter((l) => l.code !== source),
    [reference],
  );

  const update = (key: number, patch: Partial<DocumentRow>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // Calculated by characters: a line without a count is left out of the
  // quote (id 0) rather than quoted by pages.
  const byCharacters = unit === "characters";
  const documents: QuoteDraft["documents"] = rows.map((r) => ({
    source_language: r.source_language,
    target_language: r.target_language,
    document_type_id: byCharacters && charactersOf(r) === null ? 0 : r.document_type_id,
    page_count: pagesOf(r),
    character_count: byCharacters ? charactersOf(r) : null,
    copy_type: r.copy_type,
    is_notarized: r.is_notarized,
  }));
  const pricingKey = JSON.stringify(documents);

  // Debounced so typing a page count is not one request per keystroke.
  useEffect(() => {
    const input = JSON.parse(pricingKey) as QuoteInput["documents"];
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await quoteAction({
          documents: input,
          urgency,
          handover_method: handover,
        });

        if (result.ok) {
          setQuote(result.quote);
          setRowLines(result.rowLines);
          setError("");
        } else {
          setQuote(null);
          setRowLines([]);
          setError(result.error);
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [pricingKey, urgency, handover]);

  const hasFallback = rowLines.some((line) => line?.used_fallback_rate);

  const languageName = (code: string) => {
    const language = reference.languages.find((l) => l.code === code);
    return language ? nameOf(language) : code;
  };

  /** The quote as plain text, in the UI language, for a message to the client. */
  const quoteText = () => {
    if (!quote) return "";
    const lines = rows.flatMap((row, index) => {
      const line = rowLines[index];
      if (!line) return [];
      const type = reference.document_types.find((d) => d.id === row.document_type_id);
      return [
        tc("text.line", {
          n: index + 1,
          type: type ? nameOf(type) : "",
          from: languageName(row.source_language),
          to: languageName(row.target_language),
          pages: line.page_count,
          notarised: line.is_notarized ? tc("text.notarised") : "",
          price: formatMoneyString(line.price),
        }),
      ];
    });
    const urgencyOption = reference.urgency_levels.find((o) => o.value === urgency);
    return [
      tc("text.title"),
      "",
      ...lines,
      "",
      ...(urgencyOption ? [tc("text.urgency", { label: enumLabel("urgency", urgencyOption) })] : []),
      ...(quote.delivery_cost !== "0.00"
        ? [tc("text.delivery", { amount: formatMoneyString(quote.delivery_cost) })]
        : []),
      tc("text.total", { amount: formatMoneyString(quote.total) }),
    ].join("\n");
  };

  const copyQuote = async () => {
    try {
      await navigator.clipboard.writeText(quoteText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const createOrder = () => {
    saveQuoteDraft({ documents, urgency, handover_method: handover, pricing_unit: unit });
    router.push("/translations/new?from=quote");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("documents")}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRows((c) => [...c, blankRow(nextKey.current++)])}
              disabled={rows.length >= 50}
            >
              <Plus /> {t("addDocument")}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <PricingUnitToggle
              value={unit}
              onChange={setUnit}
              charactersPerPage={reference.characters_per_page ?? 1800}
            />
            {rows.map((row, index) => {
              const targets = targetsFor(row.source_language);
              const line = rowLines[index] ?? null;

              return (
                <div key={row.key} className="border-border rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium">
                      {t("documentN", { n: index + 1 })}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("duplicate")}
                        title={t("duplicate")}
                        disabled={rows.length >= 50}
                        onClick={() =>
                          setRows((c) => [...c, { ...row, key: nextKey.current++ }])
                        }
                      >
                        <Copy />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("remove")}
                        title={t("remove")}
                        // Never remove the last row: an empty calculator with
                        // no way to add the first document back is a dead end.
                        disabled={rows.length === 1}
                        onClick={() => setRows((c) => c.filter((r) => r.key !== row.key))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  {/* Two to a row until 2xl: this card is two thirds of the
                      page, and four across left each field some 130px, with
                      labels wrapping and a placeholder cut short. items-end
                      keeps the controls on one line if a label still wraps.
                      Each label and its star are one run of text: as two
                      flex items the star drifted to the far edge. */}
                  <div className="grid items-end gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor={`src-${row.key}`}>
                        <span>
                          {t("from")}
                          <span className="text-destructive ml-0.5" aria-hidden>*</span>
                        </span>
                      </Label>
                      <select
                        id={`src-${row.key}`}
                        className={selectClass}
                        value={row.source_language}
                        onChange={(e) =>
                          // Clearing the target is deliberate: the previous one
                          // may not be a valid pair with the new source.
                          update(row.key, {
                            source_language: e.target.value,
                            target_language: "",
                          })
                        }
                      >
                        <option value="">–</option>
                        {sourceLanguages.map((l) => (
                          <option key={l.code} value={l.code}>{nameOf(l)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tgt-${row.key}`}>
                        <span>
                          {t("to")}
                          <span className="text-destructive ml-0.5" aria-hidden>*</span>
                        </span>
                      </Label>
                      <select
                        id={`tgt-${row.key}`}
                        className={selectClass}
                        value={row.target_language}
                        disabled={!row.source_language}
                        onChange={(e) => update(row.key, { target_language: e.target.value })}
                      >
                        <option value="">
                          {row.source_language ? "–" : t("pickSourceFirst")}
                        </option>
                        {targets.map((l) => (
                          <option key={l.code} value={l.code}>{nameOf(l)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`type-${row.key}`}>
                        <span>
                          {t("documentType")}
                          <span className="text-destructive ml-0.5" aria-hidden>*</span>
                        </span>
                      </Label>
                      <select
                        id={`type-${row.key}`}
                        className={selectClass}
                        value={row.document_type_id || ""}
                        onChange={(e) =>
                          update(row.key, { document_type_id: Number(e.target.value) })
                        }
                      >
                        <option value="">–</option>
                        {reference.document_types.map((type) => (
                          <option key={type.id} value={type.id}>{nameOf(type)}</option>
                        ))}
                      </select>
                    </div>

                    {byCharacters && (
                      <div className="space-y-2">
                        <Label htmlFor={`chars-${row.key}`}>
                          <span>
                            {t("characters")}
                            <span className="text-destructive ml-0.5" aria-hidden>*</span>
                          </span>
                        </Label>
                        <Input
                          id={`chars-${row.key}`}
                          inputMode="numeric"
                          value={row.character_count}
                          onChange={(e) =>
                            update(row.key, { character_count: e.target.value.replace(/[^\d\s]/g, "") })
                          }
                        />
                      </div>
                    )}

                    {/* Calculated by characters, the pages are only the notary's. */}
                    {(!byCharacters || copyTypeNotarises(row.copy_type)) && (
                    <div className="space-y-2">
                      <Label htmlFor={`pages-${row.key}`}>
                        <span>
                          {byCharacters ? t("pagesForNotary") : t("pages")}
                          <span className="text-destructive ml-0.5" aria-hidden>*</span>
                        </span>
                      </Label>
                      <Input
                        id={`pages-${row.key}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={10000}
                        value={row.page_count}
                        onChange={(e) => update(row.key, { page_count: e.target.value })}
                        onBlur={() => update(row.key, { page_count: String(pagesOf(row)) })}
                      />
                    </div>
                    )}
                  </div>

                  {/* Notarisation first: it decides which copy types exist. */}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <NotarisationFields
                      idPrefix={`calc-${row.key}`}
                      copyType={row.copy_type}
                      onChange={(copyType) =>
                        update(row.key, { copy_type: copyType, is_notarized: null })
                      }
                    />
                  </div>

                  {line && (
                    <div className="border-border text-muted-foreground mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-xs">
                      <span>
                        {line.character_count && line.standard_pages
                          ? t("standardPagesLine", {
                              rate: formatMoneyString(line.base_rate_per_page),
                              count: Number(line.standard_pages).toFixed(2),
                            })
                          : t("pagesLine", {
                              rate: formatMoneyString(line.base_rate_per_page),
                              count: line.page_count,
                            })}
                        {line.document_type_multiplier !== "1.000" &&
                          ` × ${line.document_type_multiplier}`}
                        {line.urgency_multiplier !== "1.000" && ` × ${line.urgency_multiplier}`}
                      </span>
                      {line.is_notarized && (
                        <span>{t("notaryLine", { amount: formatMoneyString(line.notary_cost) })}</span>
                      )}
                      <span className="text-foreground ml-auto font-semibold">
                        {formatMoneyString(line.price)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("handover")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {reference.handover_methods.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={handover === option.value}
                onClick={() => setHandover(option.value as HandoverMethod)}
                className={cn(
                  "flex-1 rounded-md border px-4 py-3 text-left text-sm transition-colors",
                  handover === option.value
                    ? "bg-suliko-default-color border-suliko-default-color text-white"
                    : "border-input hover:bg-accent",
                )}
              >
                <span className="block font-medium">{enumLabel("handover", option)}</span>
                {option.extra_cost && option.extra_cost !== "0.00" && (
                  <span className="text-xs opacity-80">+{formatMoneyString(option.extra_cost)}</span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{tc("quote")}</CardTitle>
            {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
          </CardHeader>

          <CardContent className="space-y-3">
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}

            {hasFallback && (
              <p className="border-status-warning/40 bg-status-warning/10 flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
                <AlertTriangle className="text-status-warning mt-0.5 size-3.5 shrink-0" />
                <span>{tc("fallbackWarning")}</span>
              </p>
            )}

            {quote ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("documents")}</dt>
                  <dd className="tabular-nums">{formatMoneyString(quote.documents_total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("delivery")}</dt>
                  <dd className="tabular-nums">{formatMoneyString(quote.delivery_cost)}</dd>
                </div>
                <div className="border-border flex justify-between border-t pt-2 text-base font-semibold">
                  <dt>{t("total")}</dt>
                  <dd className="tabular-nums">{formatMoneyString(quote.total)}</dd>
                </div>

                {/* Notary cost is part of what the client is quoted, not the
                    bureau's margin — the API sends it to everyone. Only
                    translator cost and profit are the internal figures. */}
                <div className="border-border text-muted-foreground space-y-2 border-t pt-3 text-xs">
                  {canSeeCosts && (
                    <div className="flex justify-between">
                      <dt>{t("translatorCost")}</dt>
                      <dd className="tabular-nums">{formatMoneyString(quote.translator_cost_total)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>{t("notaryCost")}</dt>
                    <dd className="tabular-nums">{formatMoneyString(quote.notary_cost_total)}</dd>
                  </div>
                  {canSeeCosts && quote.gross_profit !== null && (
                    <div className="text-foreground flex justify-between font-medium">
                      <dt>{t("grossProfit")}</dt>
                      <dd className="tabular-nums">{formatMoneyString(quote.gross_profit)}</dd>
                    </div>
                  )}
                </div>
              </dl>
            ) : (
              !error && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  {t("pickToPrice")}
                </p>
              )
            )}

            {quote && (
              <div className="border-border flex flex-col gap-2 border-t pt-3">
                <Button variant="outline" size="sm" onClick={copyQuote}>
                  {copied ? <Check /> : <ClipboardCopy />}
                  {tc("copyQuote")}
                </Button>
                {copied && (
                  <p role="status" className="text-muted-foreground text-xs">
                    {tc("copied")}
                  </p>
                )}
                {canCreateOrders && (
                  <Button variant="brand" size="sm" onClick={createOrder}>
                    <FilePlus2 /> {tc("createOrder")}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
