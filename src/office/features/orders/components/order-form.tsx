"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Copy,
  FileText,
  Info,
  Languages,
  Loader2,
  Mail,
  Paperclip,
  Pencil,
  Plus,
  Save,
  Stamp,
  StickyNote,
  Trash2,
  Truck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { Link, useRouter } from "@office/i18n/navigation";
import { quoteAction, type QuoteInput } from "@office/features/calculator/actions";
import { takeQuoteDraft } from "@office/features/calculator/draft";
import type {
  CopyType,
  HandoverMethod,
  QuoteLine,
  QuoteResponse,
  ReferenceData,
  Urgency,
} from "@office/features/calculator/types";
import {
  createOrderAction,
  quickCreateDocumentTypeAction,
  quickCreateNotaryAction,
  quickCreateTranslatorAction,
  saveOrderAction,
  type OrderFormState,
} from "@office/features/orders/actions";
import { ClientPicker, type PickedClient } from "@office/features/orders/components/client-picker";
import { FileChip, type FileChipState } from "@office/features/orders/components/file-chip";
import { NotarisationFields } from "@office/features/orders/components/notarisation-fields";
import { copyTypeNotarises, normaliseCopyType } from "@office/features/orders/copy-types";
import { PricingUnitToggle } from "@office/features/orders/components/pricing-unit-toggle";
import { rememberFailedUploads } from "@office/features/orders/failed-uploads";
import { uploadDocumentFileAction } from "@office/features/orders/file-actions";
import type { DocumentFile } from "@office/features/orders/files";
import type { Assignee, OrderDetail, OrderDocument, ServiceType } from "@office/features/orders/types";
import { unitOfDocuments, type PricingUnit } from "@office/features/orders/pricing-unit";
import { CITY_CODES } from "@office/features/translators/cities";
import { LanguagePairsField } from "@office/features/translators/components/language-pairs-field";
import { WORK_KINDS } from "@office/features/translators/work-kind";
import {
  Field,
  FieldError,
  FormAlert,
  SubmitButton,
  selectClass,
  useFocusOnError,
} from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { FileDrop, useStrayDropGuard } from "@office/shared/components/form/file-drop";
import { QuickAddDialog } from "@office/shared/components/form/quick-add-dialog";
import { ToggleChip } from "@office/shared/components/form/toggle-chip";
import { IconChip } from "@office/shared/components/icon-chip";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import { Label } from "@office/shared/components/ui/label";
import { Textarea } from "@office/shared/components/ui/textarea";
import { addDays } from "@office/shared/lib/dates";
import {
  formatMoneyString,
  parseTetri,
  sumTetri,
  tetriToString,
  type Tetri,
} from "@office/shared/lib/money";
import { withFlash } from "@office/shared/lib/flash";
import { HUE_CLASSES } from "@office/shared/lib/hues";
import { cn, formatFileSize } from "@office/shared/lib/utils";
import { PHONE_PLACEHOLDER } from "@office/shared/lib/phone";
import { withBasePath } from "@office/shared/lib/base-path";

/** The API's limit on an order's documents. */
const MAX_DOCUMENTS = 50;
/** The API's limit on one file (`files.errors.tooLarge` says the same). */
const MAX_FILE_BYTES = 50 * 1024 * 1024;
/** The last option of a picker: not a record, the way to make one. */
const ADD_NEW = "__new__";

/**
 * The three money boxes of a card sit side by side from `sm` up, and two of
 * their labels run to a second line in Georgian: each label takes two lines'
 * height with its words at the foot, so the boxes stay level.
 */
const moneyLabelClass = "sm:min-h-[2.6rem] sm:items-end";

// A pill pops in when it first applies (a file is added, notarisation ticked).
const pillClass =
  "animate-in zoom-in-75 fade-in-0 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium duration-200";

/** A figure that has just changed rises into place, so a new total is seen to be new. */
const figureEnterClass = "animate-in fade-in-0 slide-in-from-bottom-1 duration-300";

const sameFile = (a: File, b: File) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/** What a band's hue adds to its mark. Literal class strings, so Tailwind keeps them. */
const BAND_ACCENT = {
  blue: "before:bg-hue-blue-ink focus-within:bg-hue-blue-tint/40",
  violet: "before:bg-hue-violet-ink focus-within:bg-hue-violet-tint/40",
  amber: "before:bg-hue-amber-ink focus-within:bg-hue-amber-tint/40",
  green: "before:bg-hue-green-ink focus-within:bg-hue-green-tint/40",
} as const;

/**
 * One band of a document card: a mark in the band's colour, then its fields.
 * The colour is the one the thing has across the app (blue documents, violet
 * translators, green money), so the eye finds "who does it" or "the files"
 * without reading a label.
 *
 * The colour is also a bar down the band's left edge, and a wash of the same
 * hue while something in the band has focus: the part being filled in is lit.
 */
function Band({
  icon,
  hue,
  children,
  className,
}: {
  icon: LucideIcon;
  hue: keyof typeof BAND_ACCENT;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 border-t py-3 pr-4 pl-5 transition-colors duration-200",
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
        BAND_ACCENT[hue],
        className,
      )}
    >
      <IconChip icon={icon} hue={hue} size="sm" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

type SectionHue = "teal" | "blue" | "yellow" | "amber" | "green" | "grey";

/** Literal class strings, so Tailwind keeps them. */
const SECTION_TINT: Record<SectionHue, string> = {
  teal: "bg-hue-teal-tint/60",
  blue: "bg-hue-blue-tint/60",
  yellow: "bg-hue-yellow-tint/60",
  amber: "bg-hue-amber-tint/60",
  green: "bg-hue-green-tint/60",
  grey: "bg-hue-grey-tint/60",
};

/** A card whose header is a `SectionHeader`: the strip brings its own spacing. */
const sectionCardClass = "gap-0 pt-0";

/**
 * A section card's header as a strip in the section's hue, with its mark on
 * a solid chip: teal for the client, blue for documents, green for money.
 * Five cards down a page are told apart by colour before a title is read.
 */
function SectionHeader({
  icon,
  hue,
  children,
  aside,
}: {
  icon: LucideIcon;
  hue: SectionHue;
  children: ReactNode;
  /** What sits at the header's other end: a button, a spinner. */
  aside?: ReactNode;
}) {
  return (
    <CardHeader
      className={cn(
        "flex flex-row flex-wrap items-center justify-between gap-2 rounded-t-[calc(var(--radius-xl)-1px)] py-3",
        SECTION_TINT[hue],
      )}
    >
      <CardTitle className="flex min-h-8 items-center gap-2.5 text-base">
        <IconChip icon={icon} hue={hue} size="sm" className={cn("size-7", HUE_CLASSES[hue].solid)} />
        {children}
      </CardTitle>
      {aside}
    </CardHeader>
  );
}

/**
 * Where a document stands, as the colour of its number and a mark at the
 * number's corner (the mark, so the colour is not the only thing saying it).
 */
const DOCUMENT_STATUS = {
  /** Still being filled in. */
  open: { badge: HUE_CLASSES.blue.soft, mark: "" },
  /** Languages and type chosen, priced. */
  done: { badge: HUE_CLASSES.green.soft, mark: HUE_CLASSES.green.solid },
  /** Priced from the default rate: someone should look at the figure. */
  check: { badge: HUE_CLASSES.amber.soft, mark: HUE_CLASSES.amber.solid },
  /** The last save found something wrong on it. */
  error: { badge: HUE_CLASSES.red.soft, mark: HUE_CLASSES.red.solid },
} as const;

/** The mark of each way an order is handed over, by the API's value. */
const HANDOVER_ICON: Record<string, LucideIcon> = {
  scan: Mail,
  pickup: Building2,
  delivery: Truck,
};

/** How far the files have got once the order is saved. */
function UploadProgress({ done, total, className }: { done: number; total: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className={cn("bg-muted h-1 overflow-hidden rounded-full", className)}
    >
      <div
        className="bg-suliko-default-color h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }}
      />
    </div>
  );
}

/**
 * The order builder — and, given an `order`, its editor.
 *
 * Shares its pricing with the calculator on purpose: both call
 * `/api/v1/calculator/quote`, which runs the same `suliko.domain.pricing` the
 * API uses when it actually stores the order, so the number on screen and the
 * number stored cannot disagree.
 *
 * What the office types over that — a negotiated price, what this translator
 * actually charges, the notary's real fee — is posted as a per-document
 * override and stored as typed. When a language pair has no rate yet, the
 * price is WRITTEN into the box from the default rate (and flagged as such)
 * rather than left as a grey hint nobody notices is not a real price.
 *
 * Editing saves header and documents in one request (`POST /orders/{id}/save`)
 * and sends, for each stored document, only what changed — which is what
 * tells the API to keep a negotiated price as it is.
 *
 * Files chosen on a card are uploaded to the document's files
 * after the order is saved: a document has no folder until it exists.
 *
 * A document is a card of bands: what it is, who does it, its files, and its
 * money when someone opens that. The header says which document it is and
 * what it costs, so a card can be folded to that one line. Files can also be
 * where an order starts: dropped on the Documents card, each becomes a
 * document.
 */

interface DocumentRow {
  key: number;
  /** The stored document this row edits; absent for a new row. */
  id?: number;
  /** Oral: interpreting, counted in minutes, with no document type or notary. */
  service_type: ServiceType;
  source_language: string;
  target_language: string;
  /** 0 on an oral line. */
  document_type_id: number;
  /** Text, so the box can be emptied while typing; restored to 1 on blur. Minutes when oral. */
  page_count: string;
  /** Characters with spaces, for a bureau that prices by characters; "" when none. */
  character_count: string;
  /** Oral only: where it takes place, and the day ("YYYY-MM-DD") and time ("HH:MM") there. */
  interpreting_place: string;
  interpreting_date: string;
  interpreting_time: string;
  /** Carries notarisation too — see `features/orders/copy-types.ts`. */
  copy_type: CopyType;
  translator_id: number | null;
  notary_id: number | null;
  price_override: string;
  translator_cost_override: string;
  notary_cost_override: string;
  /** The "Adjust prices" panel is open. */
  adjusting: boolean;
  /** Folded to its header line. */
  collapsed: boolean;
  /** Added on this visit, so it comes in with a movement; a stored one is just there. */
  fresh?: boolean;
  /** Uploaded to the document's files once the order is saved. */
  files: File[];
}

/** What a stored document looked like when the editor opened, for the diff. */
interface Original {
  service_type: ServiceType;
  document_type_id: number;
  source_language: string;
  target_language: string;
  page_count: number;
  character_count: number | null;
  interpreting_place: string;
  interpreting_date: string;
  interpreting_time: string;
  copy_type: CopyType;
  is_notarized: boolean;
  translator_id: number | null;
  notary_id: number | null;
  price: string;
  translator_cost: string;
  notary_cost: string;
}

const PRICING_FIELDS = [
  "service_type",
  "source_language",
  "target_language",
  "document_type_id",
  "page_count",
  "copy_type",
] as const;

function blankRow(key: number): DocumentRow {
  return {
    key,
    service_type: "written",
    source_language: "",
    target_language: "",
    document_type_id: 0,
    page_count: "1",
    character_count: "",
    interpreting_place: "",
    interpreting_date: "",
    interpreting_time: "",
    copy_type: "original",
    translator_id: null,
    notary_id: null,
    price_override: "",
    translator_cost_override: "",
    notary_cost_override: "",
    adjusting: false,
    collapsed: false,
    files: [],
  };
}

/** Nothing chosen or typed on it yet: the row a new order opens with. */
function isUntouched(row: DocumentRow): boolean {
  return (
    row.id === undefined &&
    !row.source_language &&
    !row.target_language &&
    !row.document_type_id &&
    row.files.length === 0 &&
    !row.price_override.trim()
  );
}

function rowFromDocument(key: number, doc: OrderDocument, collapsed: boolean): DocumentRow {
  return {
    key,
    id: doc.id,
    service_type: doc.service_type ?? "written",
    source_language: doc.source_language,
    target_language: doc.target_language,
    document_type_id: doc.document_type_id ?? 0,
    page_count: String(doc.page_count),
    character_count: doc.character_count ? String(doc.character_count) : "",
    interpreting_place: doc.interpreting_place ?? "",
    interpreting_date: doc.interpreting_date ?? "",
    interpreting_time: (doc.interpreting_time ?? "").slice(0, 5),
    copy_type: normaliseCopyType(doc.copy_type, doc.is_notarized),
    translator_id: doc.translator_id,
    notary_id: doc.notary_id,
    price_override: doc.price,
    translator_cost_override: doc.translator_cost ?? "",
    notary_cost_override: doc.notary_cost ?? "",
    adjusting: false,
    collapsed,
    files: [],
  };
}

function originalOf(doc: OrderDocument): Original {
  return {
    service_type: doc.service_type ?? "written",
    document_type_id: doc.document_type_id ?? 0,
    source_language: doc.source_language,
    target_language: doc.target_language,
    page_count: doc.page_count,
    character_count: doc.character_count ?? null,
    interpreting_place: doc.interpreting_place ?? "",
    interpreting_date: doc.interpreting_date ?? "",
    interpreting_time: (doc.interpreting_time ?? "").slice(0, 5),
    copy_type: normaliseCopyType(doc.copy_type, doc.is_notarized),
    is_notarized: doc.is_notarized,
    translator_id: doc.translator_id,
    notary_id: doc.notary_id,
    price: doc.price,
    translator_cost: doc.translator_cost ?? "",
    notary_cost: doc.notary_cost ?? "",
  };
}

const isNotarised = (row: DocumentRow) =>
  row.service_type !== "oral" && copyTypeNotarises(row.copy_type);

/**
 * A soft check of the translator picked for a document: notarised work for
 * someone not marked as able to certify, or a pair outside the languages on
 * their profile. A warning, never a block: the profile may simply be behind.
 */
function TranslatorFit({
  person,
  notarised,
  source,
  target,
  languageName,
}: {
  person: Assignee | undefined;
  notarised: boolean;
  source: string;
  target: string;
  languageName: (code: string) => string;
}) {
  const t = useTranslations("orders.fit");
  if (!person) return null;
  const problems: string[] = [];
  if (notarised && person.can_notarize === false) problems.push(t("noNotary"));
  const pairs = person.pairs ?? [];
  const listed = pairs.some((p) => p.source_language === source && p.target_language === target);
  if (source && target && pairs.length > 0 && !listed) {
    const name = (code: string) => languageName(code) || code.toUpperCase();
    problems.push(t("otherPair", { pair: `${name(source)} → ${name(target)}` }));
  }
  if (problems.length === 0) return null;
  return (
    <p className="text-status-warning animate-in fade-in-0 flex items-start gap-1.5 text-xs duration-200">
      <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{problems.join(" ")}</span>
    </p>
  );
}
/** Characters typed on a row, or null: blank, or not a whole number. */
const charactersOf = (row: DocumentRow): number | null => {
  const value = Math.floor(Number(row.character_count.replace(/\s/g, "")));
  return Number.isFinite(value) && value > 0 ? value : null;
};
const pagesOf = (row: DocumentRow) => Math.max(1, Math.floor(Number(row.page_count)) || 1);

/** A typed override, or null when the box is blank or not a valid amount. */
function override(value: string): Tetri | null {
  return value.trim() ? parseTetri(value) : null;
}

/** Same amount, whatever the formatting ("150" and "150.00"). */
function sameMoney(a: string, b: string): boolean {
  const left = parseTetri(a);
  const right = parseTetri(b);
  return left !== null && right !== null ? left === right : a.trim() === b.trim();
}

/**
 * Tracks which document row's "+" opened a quick-add dialog, and remounts
 * the dialog (via `key`) on every open so a failed attempt's error does not
 * linger into the next one.
 */
function useQuickAddTarget() {
  const [target, setTarget] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);

  return {
    target,
    open: target !== null,
    key: nonce,
    openFor: (rowKey: number) => {
      setTarget(rowKey);
      setNonce((n) => n + 1);
    },
    onOpenChange: (open: boolean) => {
      if (!open) setTarget(null);
    },
  };
}

/** Adds a stored record's own entry when the active list no longer has it. */
function withCurrent<T extends { id: number }>(list: T[], extra: (T | null)[]): T[] {
  const ids = new Set(list.map((item) => item.id));
  const missing = extra.filter(
    (item, index): item is T =>
      item !== null && !ids.has(item.id) && extra.findIndex((e) => e?.id === item.id) === index,
  );
  return missing.length ? [...list, ...missing] : list;
}

export function OrderForm({
  reference,
  translators,
  notaries,
  canAssignTranslators = true,
  canSeeCosts = false,
  canCreateClients = false,
  canCreateTranslators = false,
  canCreateNotaries = false,
  canManageDocumentTypes = false,
  claudeTranslate = false,
  fromQuote = false,
  initialClient = null,
  order,
  existingFiles,
}: {
  reference: ReferenceData;
  /** Active translators only — an inactive one should not get new work. */
  translators: Assignee[];
  notaries: Assignee[];
  /**
   * False for anyone whose plan has no translators — a freelancer does the
   * translation themselves. The picker and the translator-cost line are then
   * hidden rather than shown empty.
   */
  canAssignTranslators?: boolean;
  /**
   * `reports.profit`: what a job costs is margin. Without it the cost
   * overrides and the translator's own rate are not shown — the API strips
   * the same figures from what it returns.
   */
  canSeeCosts?: boolean;
  /** Each gates the "+" next to its field — the API enforces the same permission. */
  canCreateClients?: boolean;
  canCreateTranslators?: boolean;
  canCreateNotaries?: boolean;
  canManageDocumentTypes?: boolean;
  /** The organisation has Claude Translate: show the instructions it is given. */
  claudeTranslate?: boolean;
  /** Opened from the calculator's "Create order": pick up the quote it left. */
  fromQuote?: boolean;
  /** Preselected — "New order for this client" on a client's page. */
  initialClient?: PickedClient | null;
  /** Edit this order instead of creating one. */
  order?: OrderDetail;
  /**
   * With `order`: the files each stored document already has, by document id,
   * so a card shows what is attached before more is added. Null when they
   * could not be read.
   */
  existingFiles?: Record<number, DocumentFile[]> | null;
}) {
  const t = useTranslations("orders");
  const tf = useTranslations("files");
  const tc = useTranslations("common");
  const tq = useTranslations("orders.quickAdd");
  const tcity = useTranslations("cities");
  const te = useTranslations("enums");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = Boolean(order);

  const [state, formAction, submitting] = useActionState<OrderFormState, FormData>(
    isEdit ? saveOrderAction : createOrderAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  // Row keys come from a per-mount counter. A module-level one kept counting
  // across renders, so the server rendered `src-1` and the browser `src-2` —
  // a hydration mismatch on every visit after the first.
  const nextKey = useRef(1);
  const newKey = () => nextKey.current++;

  // A long order opens folded: three cards and up are a page of scrolling
  // before the one that needs a change, and each header already says which
  // document it is.
  const [rows, setRows] = useState<DocumentRow[]>(() =>
    order
      ? order.documents.map((doc) =>
          rowFromDocument(nextKey.current++, doc, order.documents.length >= 3),
        )
      : [blankRow(0)],
  );
  const originals = useMemo(
    () => new Map((order?.documents ?? []).map((doc) => [doc.id, originalOf(doc)])),
    [order],
  );

  const [urgency, setUrgency] = useState<Urgency>(order?.urgency ?? "standard");
  const [handover, setHandover] = useState<HandoverMethod>(order?.handover_method ?? "scan");
  // What this order is calculated by. It starts at the bureau's default, or
  // at what the order's own lines were calculated by.
  const [unit, setUnit] = useState<PricingUnit>(() =>
    unitOfDocuments(order?.documents, reference.pricing_unit ?? "pages"),
  );
  // Rows of a characters order that were submitted without their count.
  const [charMissing, setCharMissing] = useState<number[]>([]);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [rowLines, setRowLines] = useState<(QuoteLine | null)[]>([]);
  const [quoteError, setQuoteError] = useState("");
  const [isQuoting, startQuote] = useTransition();
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  // How each chosen file fared once the order was saved; absent until then.
  const [fileStatus, setFileStatus] = useState<Map<File, "uploading" | "done" | "failed">>(
    () => new Map(),
  );
  /** The card a file is being dragged over. */
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [cardDrop, setCardDrop] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  useStrayDropGuard();

  const today = reference.today ?? "";
  const [orderDate, setOrderDate] = useState(
    state.values?.order_date ?? order?.order_date ?? today,
  );
  // Until someone types a due date, a new order's follows the order date and
  // the speed. An existing order keeps the one it has, even none.
  const [dueDate, setDueDate] = useState<string | null>(
    state.values?.due_date || order?.due_date || (order ? "" : null),
  );

  // Lists behind the Document type / Translator / Notary pickers, extended in
  // place when the "+" beside one of them creates a new record. When editing,
  // a stored document's own type or assignee is kept even if it has since
  // been deactivated — otherwise the select would silently show blank.
  const [documentTypeOptions, setDocumentTypeOptions] = useState(() =>
    withCurrent(
      reference.document_types,
      (order?.documents ?? []).flatMap((doc) =>
        doc.document_type_id === null
          ? []
          : [{
        id: doc.document_type_id,
        name_en: doc.document_type_name ?? `#${doc.document_type_id}`,
        name_ka: doc.document_type_name_ka ?? doc.document_type_name ?? `#${doc.document_type_id}`,
        price_multiplier: "1.000",
      }],
      ),
    ),
  );
  const [translatorOptions, setTranslatorOptions] = useState<Assignee[]>(() =>
    withCurrent<Assignee>(
      translators,
      (order?.documents ?? []).map((doc) =>
        doc.translator_id ? { id: doc.translator_id, name: doc.translator_name ?? "" } : null,
      ),
    ),
  );
  const [notaryOptions, setNotaryOptions] = useState<Assignee[]>(() =>
    withCurrent<Assignee>(
      notaries,
      (order?.documents ?? []).map((doc) =>
        doc.notary_id ? { id: doc.notary_id, name: doc.notary_name ?? "" } : null,
      ),
    ),
  );

  const docTypeAdd = useQuickAddTarget();
  const translatorAdd = useQuickAddTarget();
  const notaryAdd = useQuickAddTarget();

  // A message under a field goes as soon as that field is changed, instead of
  // staying until the next submit while the field already says otherwise.
  const [cleared, setCleared] = useState<{ of: OrderFormState; keys: string[] }>({
    of: state,
    keys: [],
  });
  const clearedKeys = cleared.of === state ? cleared.keys : [];
  const errors: NonNullable<OrderFormState["fieldErrors"]> = Object.fromEntries(
    Object.entries(state.fieldErrors ?? {}).filter(([key]) => !clearedKeys.includes(key)),
  );
  const clearErrors = (matches: (key: string) => boolean) => {
    const keys = Object.keys(state.fieldErrors ?? {}).filter(matches);
    if (keys.length === 0) return;
    setCleared((current) => ({
      of: state,
      keys: [...(current.of === state ? current.keys : []), ...keys],
    }));
  };
  const value = (field: string, fallback = "") => state.values?.[field] ?? fallback;

  /**
   * Where the server files a document row's errors: its position in what was
   * sent. On create that is the row's index in `documents`; on edit, its
   * place among the new rows (`add`) or among the stored ones (`update`).
   */
  const documentErrorPath = (index: number) => {
    if (!isEdit) return `documents.${index}`;
    const isNew = rows[index].id === undefined;
    const position = rows.slice(0, index).filter((r) => (r.id === undefined) === isNew).length;
    return `${isNew ? "add" : "update"}.${position}`;
  };
  const isDocumentError = (key: string) => /^(documents|add|update)\./.test(key);

  const nameOf = useCallback(
    (item: { name_en: string; name_ka: string }) =>
      locale === "ka" ? item.name_ka || item.name_en : item.name_en || item.name_ka,
    [locale],
  );
  const enumLabel = (group: string, option: { value: string; label: string }) =>
    te.has(`${group}.${option.value}`) ? te(`${group}.${option.value}`) : option.label;

  // An order of interpreting only has nothing to hand over: no courier, no
  // address, no fee. What was picked is kept for when a written line is back.
  const allOral = rows.length > 0 && rows.every((row) => row.service_type === "oral");
  const sentHandover: HandoverMethod = allOral ? "scan" : handover;
  const urgencyLevels = reference.urgency_levels;
  const urgencyDays = urgencyLevels.find((o) => o.value === urgency)?.days;
  const autoDue =
    orderDate && typeof urgencyDays === "number" ? addDays(orderDate, urgencyDays) : "";
  const shownDue = dueDate ?? autoDue;

  // The calculator's "Create order" leaves its documents behind. Read once,
  // after mount — sessionStorage does not exist during the server render.
  useEffect(() => {
    if (!fromQuote) return;
    const draft = takeQuoteDraft();
    if (!draft || draft.documents.length === 0) return;
    setRows(
      draft.documents.map((d) => ({
        ...blankRow(nextKey.current++),
        source_language: d.source_language,
        target_language: d.target_language,
        document_type_id: d.document_type_id,
        page_count: String(d.page_count || 1),
        character_count: d.character_count ? String(d.character_count) : "",
        copy_type: normaliseCopyType(d.copy_type, d.is_notarized),
      })),
    );
    setUrgency(draft.urgency);
    setHandover(draft.handover_method);
    // Calculated the way the calculator did it.
    setUnit((current) => draft.pricing_unit ?? unitOfDocuments(draft.documents, current));
    setDraftLoaded(true);
  }, [fromQuote]);

  /**
   * Every active language, not only pairs with a configured rate. A pair
   * with no rate still quotes — at the fallback rate, written into the price
   * box and flagged — so restricting the dropdowns would only hide languages
   * the bureau can still take work in.
   */
  const sourceLanguages = reference.languages;
  const targetsFor = useCallback(
    (source: string) => reference.languages.filter((l) => l.code !== source),
    [reference],
  );

  const update = (key: number, patch: Partial<DocumentRow>) =>
    setRows((current) => {
      const at = current.findIndex((r) => r.key === key);
      const edited = current[at];
      return current.map((r, i) => {
        if (r.key !== key) {
          // A language chosen on one new document fills the same box on the
          // new documents after it, where that box is still empty: five files
          // dropped at once are one language pair far more often than five.
          // It never changes a choice already made, nor a stored document.
          if (!edited || i < at || r.id !== undefined) return r;
          if (patch.source_language && !r.source_language) {
            return { ...r, source_language: patch.source_language };
          }
          if (
            patch.target_language &&
            !("source_language" in patch) &&
            !r.target_language &&
            r.source_language === edited.source_language
          ) {
            return { ...r, target_language: patch.target_language };
          }
          return r;
        }
        const next = { ...r, ...patch };
        // A stored document whose substance changes is re-priced by the API
        // unless figures are sent with it — so the stored ones stop applying,
        // exactly as they would on the server.
        const substance = PRICING_FIELDS.some(
          (field) => field in patch && patch[field] !== r[field],
        );
        if (r.id !== undefined && substance) {
          if (!("price_override" in patch)) next.price_override = "";
          if (!("translator_cost_override" in patch)) next.translator_cost_override = "";
          if (!("notary_cost_override" in patch)) next.notary_cost_override = "";
        }
        // No notarisation, no notary: a notary on a document nobody takes to
        // one would be paid a fee for nothing.
        if (!isNotarised(next)) {
          next.notary_id = null;
          next.notary_cost_override = "";
        }
        return next;
      });
    });

  const typeName = (id: number) => {
    const type = documentTypeOptions.find((option) => option.id === id);
    return type ? nameOf(type) : "";
  };
  const languageName = (code: string) => {
    const language = reference.languages.find((l) => l.code === code);
    return language ? nameOf(language) : "";
  };

  /** Files the API would refuse are named now, not after the order is saved. */
  const usable = (incoming: File[]) => {
    const tooLarge = incoming.filter((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge.length) {
      toast.error(tf("errors.tooLarge"), {
        description: tooLarge.map((file) => file.name).join("\n"),
      });
    }
    // A dropped folder arrives as a file of no bytes.
    return incoming.filter((file) => file.size > 0 && file.size <= MAX_FILE_BYTES);
  };

  /** More files for one document. The same file twice is taken once. */
  const attach = (key: number, incoming: File[]) => {
    const files = usable(incoming);
    if (files.length === 0) return;
    setRows((current) =>
      current.map((r) =>
        r.key === key
          ? {
              ...r,
              files: files.reduce(
                (have, file) => (have.some((had) => sameFile(had, file)) ? have : [...have, file]),
                r.files,
              ),
            }
          : r,
      ),
    );
  };

  // The next document of an order is nearly always the same language pair,
  // for the same translator, as the one before it.
  const inherited = (from: DocumentRow | undefined): Partial<DocumentRow> =>
    from
      ? {
          source_language: from.source_language,
          target_language: from.target_language,
          translator_id: from.translator_id,
        }
      : {};

  // The card to bring into view once it is on the page: "Add document" is at
  // the top of a list the new card joins at the bottom.
  const arriving = useRef<number | null>(null);
  useEffect(() => {
    const key = arriving.current;
    if (key === null) return;
    arriving.current = null;
    const card = document.getElementById(`doc-card-${key}`);
    if (!card) return;
    const { top } = card.getBoundingClientRect();
    // Already where it can be seen: leave the page where it is.
    if (top >= 80 && top <= window.innerHeight - 200) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  }, [rows]);

  const addDocument = () => {
    const key = newKey();
    arriving.current = key;
    setRows((current) => [
      ...current,
      { ...blankRow(key), ...inherited(current.at(-1)), fresh: true },
    ]);
  };

  /**
   * An order started from its files: each one becomes a document with the
   * file on it. They take the place of the empty card a new order opens
   * with, when that is all there is.
   */
  const addDocumentsFromFiles = (incoming: File[]) => {
    const files = usable(incoming);
    if (files.length === 0) return;
    const keys = files.map(() => newKey());
    const kept = rows.length === 1 && isUntouched(rows[0]) ? [] : rows;
    const room = MAX_DOCUMENTS - kept.length;
    if (files.length > room) toast.error(t("tooManyDocuments", { max: MAX_DOCUMENTS }));
    const made = files.slice(0, Math.max(0, room)).map((file, n) => ({
      ...blankRow(keys[n]),
      ...inherited(kept.at(-1) ?? rows.at(-1)),
      files: [file],
      fresh: true,
    }));
    if (made.length === 0) return;
    arriving.current = made[0].key;
    clearErrors(isDocumentError);
    setRows([...kept, ...made]);
  };

  const stateOf = (file: File): FileChipState => {
    const status = fileStatus.get(file);
    if (status === "uploading") {
      return { hue: "blue", icon: Loader2, label: t("fileUploading"), busy: true };
    }
    if (status === "done") return { hue: "green", icon: Check, label: t("fileUploaded") };
    if (status === "failed") return { hue: "red", icon: AlertTriangle, label: t("fileFailed") };
    return { hue: "yellow", icon: Clock, label: t("filePending") };
  };

  // An order calculated by characters: each written line carries a character
  // count, and the pages stay for the notary.
  const byCharacters = unit === "characters";
  const charactersPerPage = reference.characters_per_page ?? 1800;

  // Only what changes the price goes into the quote, so assigning a
  // translator or typing an override does not send another request.
  const pricingKey = JSON.stringify(
    rows.map((r) => ({
      service_type: r.service_type,
      source_language: r.source_language,
      target_language: r.target_language,
      // A written line with no character count yet cannot be priced in a
      // characters bureau: an id of 0 leaves it out of the quote, as an
      // unfinished line is, rather than quoting it by pages.
      document_type_id:
        r.service_type === "oral"
          ? null
          : byCharacters && charactersOf(r) === null
            ? 0
            : r.document_type_id,
      page_count: pagesOf(r),
      character_count: r.service_type === "oral" || !byCharacters ? null : charactersOf(r),
      copy_type: r.service_type === "oral" ? "original" : r.copy_type,
      is_notarized: null,
    })),
  );

  // Debounced so typing a page count is not one request per keystroke.
  useEffect(() => {
    const documents = JSON.parse(pricingKey) as QuoteInput["documents"];
    const timer = setTimeout(() => {
      startQuote(async () => {
        const result = await quoteAction({ documents, urgency, handover_method: sentHandover });
        if (result.ok) {
          setQuote(result.quote);
          setRowLines(result.rowLines);
          setQuoteError("");
        } else {
          setQuote(null);
          setRowLines([]);
          setQuoteError(result.error);
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [pricingKey, urgency, sentHandover]);

  const translatorById = useMemo(
    () => new Map(translatorOptions.map((p) => [p.id, p])),
    [translatorOptions],
  );

  /** A translator's own rate × pages, which the API applies when no cost is typed. */
  const translatorDefault = (row: DocumentRow): Tetri | null => {
    // A per-page rate says nothing about minutes: an oral line takes the share.
    if (row.service_type === "oral") return null;
    const rate = row.translator_id ? translatorById.get(row.translator_id)?.default_rate : null;
    const perPage = parseTetri(rate);
    return perPage === null ? null : perPage * pagesOf(row);
  };

  /**
   * The price written in for a pair with no configured rate — the default
   * rate's figure, in the box rather than as a placeholder, so it is visibly
   * a real price that will be saved. Null once someone types their own.
   */
  const autoPriceOf = (row: DocumentRow, line: QuoteLine | null | undefined): string | null =>
    line?.used_fallback_rate && !row.price_override.trim() ? line.price : null;

  // The summary, overrides applied. Rows the API has not priced (incomplete)
  // are left out, exactly as the preview leaves them out.
  const figures = (() => {
    if (!quote) return null;
    const priced = rows
      .map((row, index) => ({ row, line: rowLines[index] }))
      .filter((entry): entry is { row: DocumentRow; line: QuoteLine } => Boolean(entry.line));

    const prices = priced.map(
      ({ row, line }) => override(row.price_override) ?? parseTetri(line.price) ?? 0,
    );
    const translatorCosts = priced.map(
      ({ row, line }) =>
        override(row.translator_cost_override) ??
        translatorDefault(row) ??
        parseTetri(line.translator_cost) ??
        0,
    );
    const notaryCosts = priced.map(({ row, line }) =>
      line.is_notarized
        ? (override(row.notary_cost_override) ?? parseTetri(line.notary_cost) ?? 0)
        : 0,
    );

    const documents = sumTetri(prices);
    const delivery = parseTetri(quote.delivery_cost) ?? 0;
    const translator = canAssignTranslators ? sumTetri(translatorCosts) : 0;
    const notary = sumTetri(notaryCosts);
    return {
      documents,
      delivery,
      total: documents + delivery,
      translator,
      notary,
      // The courier fee is passed through to the courier, not earned.
      profit: documents - translator - notary,
    };
  })();

  const hasAutoPrice = rows.some((row, index) => autoPriceOf(row, rowLines[index]) !== null);

  /** A row as `OrderDocumentIn` — see the JSON note in `schema.ts`. */
  const asNew = (r: DocumentRow, index: number) => ({
    service_type: r.service_type,
    source_language: r.source_language,
    target_language: r.target_language,
    document_type_id: r.service_type === "oral" ? null : r.document_type_id,
    page_count: Math.floor(Number(r.page_count)) || 0,
    character_count: r.service_type === "oral" || !byCharacters ? null : charactersOf(r),
    // Left out when empty: an API that does not know the fields refuses them.
    ...(r.service_type === "oral"
      ? {
          interpreting_place: r.interpreting_place.trim() || undefined,
          interpreting_date: r.interpreting_date || undefined,
          interpreting_time: r.interpreting_time || undefined,
        }
      : {}),
    copy_type: r.service_type === "oral" ? "original" : r.copy_type,
    is_notarized: null,
    translator_id: canAssignTranslators ? r.translator_id : null,
    notary_id: isNotarised(r) ? r.notary_id : null,
    price_override: r.price_override.trim() || autoPriceOf(r, rowLines[index]) || null,
    translator_cost_override: canSeeCosts ? r.translator_cost_override.trim() || null : null,
    notary_cost_override:
      canSeeCosts && isNotarised(r) ? r.notary_cost_override.trim() || null : null,
  });

  /** A stored row's changes, as `OrderDocumentUpdate` — only what differs. */
  const asChange = (r: DocumentRow, index: number, was: Original) => {
    const change: Record<string, unknown> = { id: r.id };
    const pages = Math.floor(Number(r.page_count)) || 0;
    const oral = r.service_type === "oral";
    if (r.service_type !== was.service_type) change.service_type = r.service_type;
    // An oral line has no document type: the API clears it. Back to written, send one.
    if (!oral && (r.document_type_id !== was.document_type_id || r.service_type !== was.service_type)) {
      change.document_type_id = r.document_type_id;
    }
    if (r.source_language !== was.source_language) change.source_language = r.source_language;
    if (r.target_language !== was.target_language) change.target_language = r.target_language;
    if (pages !== was.page_count) change.page_count = pages;
    if (!oral) {
      // Null when the order is now calculated by pages: it clears a count the
      // line had, and the API prices it by its pages again.
      const characters = byCharacters ? charactersOf(r) : null;
      if (characters !== was.character_count) change.character_count = characters;
    }
    // Where it is interpreted. Cleared (null) when emptied; a written line sends
    // nothing (the API drops it when a line stops being oral).
    for (const key of ["interpreting_place", "interpreting_date", "interpreting_time"] as const) {
      const now = oral ? r[key].trim() : "";
      if (now !== was[key]) change[key] = now || null;
    }
    if (!oral && (r.copy_type !== was.copy_type || isNotarised(r) !== was.is_notarized)) {
      change.copy_type = r.copy_type;
      change.is_notarized = isNotarised(r);
    }
    if (canAssignTranslators && r.translator_id !== was.translator_id) {
      change.translator_id = r.translator_id;
    }
    const notary = isNotarised(r) ? r.notary_id : null;
    if (notary !== was.notary_id) change.notary_id = notary;

    const price = r.price_override.trim() || autoPriceOf(r, rowLines[index]) || "";
    if (price && !sameMoney(price, was.price)) change.price = price;
    if (canSeeCosts) {
      const cost = r.translator_cost_override.trim();
      if (cost && !sameMoney(cost, was.translator_cost)) change.translator_cost = cost;
      const fee = isNotarised(r) ? r.notary_cost_override.trim() : "";
      if (fee && !sameMoney(fee, was.notary_cost)) change.notary_cost = fee;
    }
    return change;
  };

  const documentsJson = isEdit ? "" : JSON.stringify(rows.map(asNew));
  const changesJson = isEdit
    ? JSON.stringify({
        add: rows.flatMap((r, i) => (r.id === undefined ? [asNew(r, i)] : [])),
        update: rows.flatMap((r, i) => {
          const was = r.id !== undefined ? originals.get(r.id) : undefined;
          return was ? [asChange(r, i, was)] : [];
        }),
        remove: [...originals.keys()].filter((id) => !rows.some((r) => r.id === id)),
      })
    : "";

  // Once saved: files to storage, then to the order. `rows` is read through a
  // ref so the upload uses the rows as they were submitted.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);
  const handled = useRef<OrderFormState["saved"]>(undefined);
  useEffect(() => {
    const saved = state.saved;
    if (!saved || handled.current === saved) return;
    handled.current = saved;

    const current = rowsRef.current;
    const added = [...(saved.addedDocumentIds ?? [])];
    const documentIds = saved.documentIds
      ? saved.documentIds
      : current.map((row) => row.id ?? added.shift());
    const jobs = current.flatMap((row, index) => {
      const documentId = documentIds[index];
      return documentId ? row.files.map((file) => ({ file, documentId })) : [];
    });

    void (async () => {
      const failures: string[] = [];
      const mark = (file: File, status: "uploading" | "done" | "failed") =>
        setFileStatus((had) => new Map(had).set(file, status));
      if (jobs.length) setUploading({ done: 0, total: jobs.length });
      for (const [n, job] of jobs.entries()) {
        const body = new FormData();
        body.set("order_id", String(saved.orderId));
        body.set("document_id", String(job.documentId));
        body.set("kind", "source");
        body.set("file", job.file);
        mark(job.file, "uploading");
        let failure: string | null = null;
        try {
          const outcome = await uploadDocumentFileAction(body);
          if (!outcome.ok) failure = `${job.file.name}: ${outcome.error}`;
        } catch {
          failure = job.file.name;
        }
        if (failure) failures.push(failure);
        mark(job.file, failure ? "failed" : "done");
        setUploading({ done: n + 1, total: jobs.length });
      }
      if (failures.length) {
        // The order is saved and this page is about to be left: a toast alone
        // went with it. The order's files panel keeps the list until it is
        // dismissed there.
        rememberFailedUploads(saved.orderId, failures);
        toast.error(t("filesFailed", { count: failures.length }), {
          description: failures.join("\n"),
          duration: 15000,
        });
      }
      router.push(
        withFlash(`/translations/${saved.orderId}`, isEdit ? "orderSaved" : "orderCreated"),
      );
    })();
  }, [state.saved, router, t, isEdit]);

  const pickedClient: PickedClient | null = state.values?.client_id
    ? {
        id: Number(state.values.client_id),
        name: state.values.client_id_label || `#${state.values.client_id}`,
        client_type: state.values.client_id_type === "B2B" ? "B2B" : "B2C",
      }
    : initialClient;

  const money = (tetri: Tetri) => formatMoneyString(tetriToString(tetri));

  // Submitted by hand rather than through `action`: React resets a form
  // after its action runs, which put every controlled select back on its
  // first option on screen. A failed submit showed Copy type as "Plain copy"
  // while the order still held "Original" (audit F02). Here nothing is reset
  // and every value stays as it was typed.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    // A quick-add dialog's form is portalled out of this one in the DOM, but
    // its submit still bubbles up the React tree to here.
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    // An order calculated by characters needs each written line's count. The
    // API would take a line without one and price it by its pages, so the
    // form is the one that asks.
    if (byCharacters) {
      const missing = rows
        .filter((row) => row.service_type !== "oral" && charactersOf(row) === null)
        .map((row) => row.key);
      if (missing.length > 0) {
        setCharMissing(missing);
        toast.error(t("characterCountRequired"));
        const first = document.getElementById(`chars-${missing[0]}`);
        first?.focus();
        first?.scrollIntoView({ block: "center" });
        return;
      }
    }
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    // `noValidate`: the messages are the app's own, in the reader's language,
    // under the field they are about, never the browser's bubble.
    <form ref={formRef} onSubmit={submit} noValidate>
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      {order ? (
        <>
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="changes" value={changesJson} />
          {/* Not on this form any more; carried so saving never clears it. */}
          <input type="hidden" name="contact_info" value={order.contact_info ?? ""} />
        </>
      ) : (
        <input type="hidden" name="documents" value={documentsJson} />
      )}
      <input type="hidden" name="urgency" value={urgency} />
      <input type="hidden" name="handover_method" value={sentHandover} />

      <FormAlert message={state.error} stepUp={state.stepUp} />

      {draftLoaded && (
        <p className="border-border bg-muted/40 mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Info className="text-muted-foreground size-4 shrink-0" aria-hidden />
          {t("fromQuote")}
        </p>
      )}

      {/* `grid-cols-1`, not the implicit column: that one is as wide as its
          widest unbreakable line, and a long client name (one line, cut with
          an ellipsis) pushed the whole form off the side of a phone. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card className={sectionCardClass}>
            {/* Named for all it holds: titled "Client" over a field
                labelled "Client", it said one thing twice. */}
            <SectionHeader icon={UserRound} hue="teal">
              {t("clientAndDates")}
            </SectionHeader>
            <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
              {order ? (
                // The client can change too, while nothing is paid on the
                // order; the API says so if it is (audit F29).
                <Field
                  name="client_id"
                  label={t("client")}
                  errors={errors.client_id}
                  hint={t("edit.clientHint")}
                  className="sm:col-span-2"
                  required
                >
                  <ClientPicker
                    initial={
                      pickedClient ?? {
                        id: order.client_id,
                        name: order.client_name,
                        client_type: order.client_type,
                      }
                    }
                    invalid={Boolean(errors.client_id?.length)}
                    canCreate={canCreateClients}
                    sourceOptions={reference.acquisition_sources}
                  />
                </Field>
              ) : (
                <Field
                  name="client_id"
                  label={t("client")}
                  errors={errors.client_id}
                  className="sm:col-span-2"
                  required
                >
                  <ClientPicker
                    initial={pickedClient}
                    invalid={Boolean(errors.client_id?.length)}
                    canCreate={canCreateClients}
                    sourceOptions={reference.acquisition_sources}
                  />
                </Field>
              )}

              <Field name="order_date" label={t("orderDate")} errors={errors.order_date}>
                <Input
                  id="order_date"
                  name="order_date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </Field>

              <Field
                name="due_date"
                label={t("dueDate")}
                errors={errors.due_date}
                hint={isEdit ? undefined : t("dueDateHint")}
              >
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  min={orderDate || undefined}
                  value={shownDue}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>

              <Field
                name="identifier"
                label={t("identifier")}
                errors={errors.identifier}
                hint={t("identifierHint")}
                className="sm:col-span-2"
              >
                <Input
                  id="identifier"
                  name="identifier"
                  maxLength={100}
                  defaultValue={value("identifier", order?.identifier ?? "")}
                />
              </Field>
            </CardContent>
          </Card>

          <Card
            className={cn(
              sectionCardClass,
              "transition-shadow",
              cardDrop && "ring-suliko-default-color/30 ring-4",
            )}
            // Files dropped on the card, outside any document, start one
            // document each. A document takes its own drop first.
            onDragOver={(event) => {
              if (event.defaultPrevented) {
                setCardDrop(false);
                return;
              }
              if (uploading || !event.dataTransfer.types.includes("Files")) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setCardDrop(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setCardDrop(false);
              }
            }}
            onDrop={(event) => {
              setCardDrop(false);
              if (event.defaultPrevented || uploading) return;
              if (!event.dataTransfer.types.includes("Files")) return;
              event.preventDefault();
              addDocumentsFromFiles(Array.from(event.dataTransfer.files));
            }}
          >
            {/* The header wraps: on a phone the title and "Add document" in
                Georgian are wider than the card, and the button hung off its
                edge. */}
            <SectionHeader
              icon={FileText}
              hue="blue"
              aside={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-card shadow-xs"
                  onClick={addDocument}
                  disabled={rows.length >= MAX_DOCUMENTS}
                >
                  <Plus /> {t("addDocument")}
                </Button>
              }
            >
              {t("documents")}
              <span
                key={rows.length}
                className={cn(
                  "bg-card text-hue-blue-ink rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  figureEnterClass,
                )}
              >
                {rows.length}
              </span>
            </SectionHeader>

            <CardContent className="space-y-3 pt-5">
              <PricingUnitToggle
                value={unit}
                onChange={(next) => {
                  setUnit(next);
                  setCharMissing([]);
                }}
                charactersPerPage={charactersPerPage}
                disabled={uploading !== null}
              />

              {errors.documents && (
                <p className="text-destructive text-xs">{errors.documents.join(" ")}</p>
              )}

              {rows.map((row, index) => {
                const targets = targetsFor(row.source_language);
                const line = rowLines[index] ?? null;
                const notarised = isNotarised(row);
                const translator = row.translator_id
                  ? translatorById.get(row.translator_id)
                  : undefined;
                const rateDefault = translatorDefault(row);
                const autoPrice = autoPriceOf(row, line);

                // This row's messages, and the props that tie a control to
                // its message: marked invalid, described by it.
                const path = documentErrorPath(index);
                const rowHasErrors = Object.keys(errors).some((key) => key.startsWith(`${path}.`));
                const showAdjust =
                  row.adjusting ||
                  autoPrice !== null ||
                  Object.keys(errors).some((key) =>
                    /\.(price|translator_cost|notary_cost)(_override)?$/.test(key) &&
                    key.startsWith(`${path}.`),
                  );
                const shownPrice = row.price_override || autoPrice || "";
                const errorsFor = (...fields: string[]) =>
                  fields.flatMap((field) => errors[`${path}.${field}`] ?? []);
                const invalidProps = (id: string, messages: string[]) =>
                  messages.length > 0
                    ? { "aria-invalid": true, "aria-describedby": `${id}-error` }
                    : {};
                const change = (patch: Partial<DocumentRow>) => {
                  const fields = Object.keys(patch).map((field) =>
                    field.replace(/_override$/, ""),
                  );
                  clearErrors((key) =>
                    fields.some(
                      (field) => key === `${path}.${field}` || key === `${path}.${field}_override`,
                    ),
                  );
                  update(row.key, patch);
                };
                const oral = row.service_type === "oral";
                const sourceErrors = errorsFor("source_language");
                const targetErrors = errorsFor("target_language");
                const typeErrors = errorsFor("document_type_id");
                const pageErrors = errorsFor("page_count");
                const priceErrors = errorsFor("price_override", "price");
                const translatorCostErrors = errorsFor("translator_cost_override", "translator_cost");
                const notaryCostErrors = errorsFor("notary_cost_override", "notary_cost");
                const otherErrors = errorsFor(
                  "copy_type",
                  "is_notarized",
                  "translator_id",
                  "notary_id",
                  "id",
                );

                // What the header says about the document, so a folded card
                // (and a glance at an open one) tells which document it is.
                const stored = row.id !== undefined ? (existingFiles?.[row.id] ?? []) : [];
                const fileCount = stored.length + row.files.length;
                // A card with a message in it cannot be folded over it.
                const open = !row.collapsed || rowHasErrors;
                const heading =
                  (oral ? t("oralHeading") : typeName(row.document_type_id)) ||
                  row.files[0]?.name ||
                  stored[0]?.name ||
                  t("documentN", { n: index + 1 });
                const pair = row.source_language
                  ? `${languageName(row.source_language)} → ${languageName(row.target_language) || "…"}`
                  : "";
                // Calculated by characters, the pages are only the notary's: the
                // characters are what the line is about, and the pages follow
                // them where there is a notary fee to work out.
                const characters = charactersOf(row);
                const showPages = oral || !byCharacters || notarised;
                const sizeFact =
                  !oral && byCharacters
                    ? characters !== null
                      ? t("charactersShort", { count: characters })
                      : null
                    : null;
                const facts = [
                  pair,
                  sizeFact,
                  showPages ? t(oral ? "minutesShort" : "pagesShort", { count: pagesOf(row) }) : null,
                  translator?.name,
                ].filter(Boolean);
                const typed = override(row.price_override);
                const price = typed ?? parseTetri(autoPrice) ?? parseTetri(line?.price);
                // Typed by hand and not what the price list gives: said in a
                // word, not as two unlabelled amounts side by side.
                const manual = typed !== null && line !== null && !sameMoney(row.price_override, line.price);
                const status = rowHasErrors
                  ? "error"
                  : autoPrice !== null
                    ? "check"
                    : line !== null
                      ? "done"
                      : "open";
                const statusLabel =
                  status === "error"
                    ? t("statusError")
                    : status === "check"
                      ? t("statusCheck")
                      : status === "done"
                        ? t("statusDone")
                        : "";

                return (
                  <div
                    key={row.key}
                    id={`doc-card-${row.key}`}
                    className={cn(
                      "border-border bg-card @container scroll-mt-20 overflow-hidden rounded-lg border transition-[background-color,border-color,box-shadow] duration-200",
                      // Depth says which card is being worked on: the open one
                      // stands off the page, a folded one lies flat until the
                      // pointer is on it.
                      open ? "shadow-md" : "shadow-xs hover:shadow-md",
                      row.fresh && "animate-in fade-in-0 slide-in-from-bottom-3 duration-300",
                      rowHasErrors && "border-destructive/50",
                      dropTarget === row.key &&
                        "border-suliko-default-color bg-hue-blue-tint/40 ring-suliko-default-color/15 border-dashed ring-4",
                    )}
                    // A file dropped anywhere on the card is this document's.
                    onDragOver={(event) => {
                      if (uploading || !event.dataTransfer.types.includes("Files")) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                      setDropTarget(row.key);
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setDropTarget(null);
                      }
                    }}
                    onDrop={(event) => {
                      if (uploading || !event.dataTransfer.types.includes("Files")) return;
                      event.preventDefault();
                      setDropTarget(null);
                      attach(row.key, Array.from(event.dataTransfer.files));
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`doc-${row.key}-body`}
                        className="focus-visible:ring-ring/50 order-1 flex min-w-0 flex-1 basis-0 cursor-pointer items-center gap-3 rounded-md text-left outline-none focus-visible:ring-[3px]"
                        onClick={() => update(row.key, { collapsed: !row.collapsed })}
                      >
                        <ChevronDown
                          className={cn(
                            "text-muted-foreground size-4 shrink-0 transition-transform",
                            !open && "-rotate-90",
                          )}
                          aria-hidden
                        />
                        <span
                          aria-hidden
                          title={statusLabel || undefined}
                          className={cn(
                            "relative flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors duration-300",
                            DOCUMENT_STATUS[status].badge,
                          )}
                        >
                          {index + 1}
                          {status !== "open" && (
                            <span
                              // Keyed, so the mark pops again when the state changes.
                              key={status}
                              className={cn(
                                "ring-card animate-in zoom-in-50 absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-xs leading-none font-semibold ring-2 duration-200",
                                DOCUMENT_STATUS[status].mark,
                              )}
                            >
                              {status === "done" ? <Check className="size-2.5" strokeWidth={3.5} /> : "!"}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{heading}</span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {facts.join(" · ")}
                          </span>
                          {statusLabel && <span className="sr-only">{statusLabel}</span>}
                        </span>
                      </button>

                      {/* Its own line under the title on a narrow card (a
                          phone), where pills, price and three buttons do not
                          fit beside it; one line with the rest from @xl. */}
                      <div className="order-3 flex basis-full items-center gap-2 @xl:order-2 @xl:basis-auto">
                        {notarised && (
                          <span
                            title={t("notarisedShort")}
                            className={cn(pillClass, HUE_CLASSES.plum.soft)}
                          >
                            <Stamp className="size-3.5" aria-hidden />
                            <span className="sr-only @2xl:not-sr-only">{t("notarisedShort")}</span>
                          </span>
                        )}
                        {fileCount > 0 && (
                          <span
                            title={t("fileCount", { count: fileCount })}
                            className={cn(pillClass, HUE_CLASSES.amber.soft)}
                          >
                            <Paperclip className="size-3.5" aria-hidden />
                            <span className="tabular-nums" aria-hidden>
                              {fileCount}
                            </span>
                            <span className="sr-only">{t("fileCount", { count: fileCount })}</span>
                          </span>
                        )}
                        {manual && line && (
                          <span
                            title={t("calculated", { amount: formatMoneyString(line.price) })}
                            className={cn(pillClass, HUE_CLASSES.yellow.soft)}
                          >
                            {t("manualPrice")}
                          </span>
                        )}
                        <span
                          key={price ?? "none"}
                          className={cn(
                            "ml-auto text-sm font-semibold whitespace-nowrap tabular-nums @xl:ml-0",
                            figureEnterClass,
                            price !== null ? "text-hue-green-ink" : "text-muted-foreground",
                          )}
                        >
                          {price !== null ? money(price) : "–"}
                        </span>
                      </div>

                      <div className="order-2 flex shrink-0 @xl:order-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={showAdjust && open ? t("hidePrices") : t("adjustPrices")}
                          title={showAdjust && open ? t("hidePrices") : t("adjustPrices")}
                          aria-expanded={showAdjust && open}
                          // A price written in from the default rate stays
                          // in view until someone has looked at it.
                          disabled={autoPrice !== null && open}
                          onClick={() =>
                            update(row.key, {
                              adjusting: open ? !row.adjusting : true,
                              collapsed: false,
                            })
                          }
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("duplicate")}
                          title={t("duplicate")}
                          disabled={rows.length >= MAX_DOCUMENTS}
                          // A copy is a new document: no stored id, no files.
                          onClick={() => {
                            const key = newKey();
                            arriving.current = key;
                            setRows((c) => [
                              ...c,
                              { ...row, key, id: undefined, files: [], collapsed: false, fresh: true },
                            ]);
                          }}
                        >
                          <Copy />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("remove")}
                          title={t("remove")}
                          // Never remove the last row: an order with no
                          // documents and no way to add one is a dead end.
                          disabled={rows.length === 1}
                          onClick={() => {
                            // The rows after it move up, and their messages
                            // would land on the wrong document.
                            clearErrors(isDocumentError);
                            setRows((c) => c.filter((r) => r.key !== row.key));
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>

                    {/* Folds by height rather than by leaving the page: 0fr
                        to 1fr is how a height nobody knows is animated.
                        `inert` while folded keeps the hidden fields out of
                        the tab order and away from a screen reader. */}
                    <div
                      id={`doc-${row.key}-body`}
                      inert={!open}
                      className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out",
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="min-h-0 overflow-hidden">
                        {/* What the document is. */}
                        <Band icon={Languages} hue="blue">
                          <div className="grid gap-3 @2xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
                            <div className="space-y-2">
                              <Label htmlFor={`src-${row.key}`}>
                                {t("languages")}
                                <span className="text-destructive ml-0.5" aria-hidden>*</span>
                              </Label>
                              <div className="flex flex-col gap-2 @sm:flex-row @sm:items-start">
                                <div className="min-w-0 flex-1 space-y-2">
                                  <select
                                    id={`src-${row.key}`}
                                    aria-label={t("from")}
                                    className={cn(
                                      selectClass,
                                      !row.source_language && "text-muted-foreground",
                                    )}
                                    value={row.source_language}
                                    aria-required
                                    {...invalidProps(`src-${row.key}`, sourceErrors)}
                                    onChange={(e) =>
                                      // Clearing the target is deliberate: the old one
                                      // may not form a valid pair with the new source.
                                      change({
                                        source_language: e.target.value,
                                        target_language: "",
                                      })
                                    }
                                  >
                                    <option value="">{t("from")}</option>
                                    {sourceLanguages.map((l) => (
                                      <option key={l.code} value={l.code}>
                                        {nameOf(l)}
                                      </option>
                                    ))}
                                  </select>
                                  <FieldError id={`src-${row.key}`} messages={sourceErrors} />
                                </div>
                                <ArrowRight
                                  className="text-muted-foreground mt-2.5 hidden size-4 shrink-0 @sm:block"
                                  aria-hidden
                                />
                                <div className="min-w-0 flex-1 space-y-2">
                                  <select
                                    id={`tgt-${row.key}`}
                                    aria-label={t("to")}
                                    className={cn(
                                      selectClass,
                                      !row.target_language && "text-muted-foreground",
                                    )}
                                    value={row.target_language}
                                    disabled={!row.source_language}
                                    aria-required
                                    {...invalidProps(`tgt-${row.key}`, targetErrors)}
                                    onChange={(e) => change({ target_language: e.target.value })}
                                  >
                                    <option value="">
                                      {row.source_language ? t("to") : t("pickSourceFirst")}
                                    </option>
                                    {targets.map((l) => (
                                      <option key={l.code} value={l.code}>
                                        {nameOf(l)}
                                      </option>
                                    ))}
                                  </select>
                                  <FieldError id={`tgt-${row.key}`} messages={targetErrors} />
                                </div>
                              </div>
                            </div>

                            {/* Level with the two selects, not with the whole column: the
                                label above them is 28px with its gap, and the control is as tall as a
                                select, so it reads as a third field on the same row. The
                                whole box is the click target. */}
                            <label
                              htmlFor={`oral-${row.key}`}
                              className="border-input hover:bg-accent flex h-9 w-fit cursor-pointer items-center gap-2.5 self-start rounded-md border px-3 text-sm transition-colors @2xl:mt-[28px]"
                            >
                              <Checkbox
                                id={`oral-${row.key}`}
                                checked={oral}
                                onCheckedChange={(on) =>
                                  change(
                                    on === true
                                      ? {
                                          service_type: "oral",
                                          document_type_id: 0,
                                          copy_type: "original",
                                          notary_id: null,
                                          // Starts on the order's own day.
                                          interpreting_date: row.interpreting_date || orderDate,
                                        }
                                      : { service_type: "written" },
                                  )
                                }
                              />
                              <span>{t("oralLabel")}</span>
                            </label>

                            {/* The type takes the width: its names are long
                                and a page count is four digits at most. */}
                            <div className="flex flex-col gap-3 @sm:flex-row @sm:items-start">
                              {!oral && (
                              <div className="min-w-0 flex-1 space-y-2">
                                <Label htmlFor={`type-${row.key}`}>
                                  {t("documentType")}
                                  <span className="text-destructive ml-0.5" aria-hidden>*</span>
                                </Label>
                                <select
                                  id={`type-${row.key}`}
                                  className={selectClass}
                                  value={row.document_type_id || ""}
                                  aria-required
                                  {...invalidProps(`type-${row.key}`, typeErrors)}
                                  onChange={(e) => {
                                    if (e.target.value === ADD_NEW) {
                                      e.target.value = String(row.document_type_id || "");
                                      docTypeAdd.openFor(row.key);
                                      return;
                                    }
                                    change({ document_type_id: Number(e.target.value) });
                                  }}
                                >
                                  <option value="">–</option>
                                  {documentTypeOptions.map((type) => (
                                    <option key={type.id} value={type.id}>
                                      {nameOf(type)}
                                    </option>
                                  ))}
                                  {canManageDocumentTypes && (
                                    <option value={ADD_NEW}>+ {t("addDocumentType")}</option>
                                  )}
                                </select>
                                <FieldError id={`type-${row.key}`} messages={typeErrors} />
                              </div>
                              )}

                              {byCharacters && !oral && (
                                <div className="shrink-0 space-y-2 @sm:w-36">
                                  <Label htmlFor={`chars-${row.key}`}>
                                    {t("characters")}
                                    <span className="text-destructive ml-0.5" aria-hidden>*</span>
                                  </Label>
                                  <Input
                                    id={`chars-${row.key}`}
                                    inputMode="numeric"
                                    value={row.character_count}
                                    aria-required
                                    aria-invalid={charMissing.includes(row.key) || undefined}
                                    aria-describedby={
                                      charMissing.includes(row.key) ? `chars-${row.key}-error` : undefined
                                    }
                                    onChange={(e) => {
                                      setCharMissing((was) => was.filter((key) => key !== row.key));
                                      change({ character_count: e.target.value.replace(/[^\d\s]/g, "") });
                                    }}
                                  />
                                  <FieldError
                                    id={`chars-${row.key}`}
                                    messages={
                                      charMissing.includes(row.key) ? [t("characterCountRequired")] : []
                                    }
                                  />
                                </div>
                              )}

                              {showPages && (
                              <div
                                className={cn(
                                  "shrink-0 space-y-2",
                                  // The longer label of a notary's pages needs the room.
                                  !oral && byCharacters ? "@sm:w-36" : "@sm:w-24",
                                )}
                              >
                                <Label htmlFor={`pages-${row.key}`}>
                                  {oral
                                    ? t("minutes")
                                    : byCharacters
                                      ? t("pagesForNotary")
                                      : t("pages")}
                                  <span className="text-destructive ml-0.5" aria-hidden>*</span>
                                </Label>
                                <Input
                                  id={`pages-${row.key}`}
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  max={10000}
                                  value={row.page_count}
                                  aria-required
                                  {...invalidProps(`pages-${row.key}`, pageErrors)}
                                  onChange={(e) => change({ page_count: e.target.value })}
                                  onBlur={() => update(row.key, { page_count: String(pagesOf(row)) })}
                                />
                                <FieldError id={`pages-${row.key}`} messages={pageErrors} />
                              </div>
                              )}
                            </div>
                          </div>

                          {/* Notarisation first: it decides which copy types exist.
                              Interpreting has no document to notarise. */}
                          {!oral && (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <NotarisationFields
                                idPrefix={`doc-${row.key}`}
                                copyType={row.copy_type}
                                onChange={(copyType) => change({ copy_type: copyType })}
                              />
                            </div>
                          )}
                          {/* Where and when the interpreting takes place. All
                              optional; the price does not depend on it. */}
                          {oral && (
                            <div className="mt-3 grid gap-3 @sm:grid-cols-[minmax(0,1fr)_9.5rem_7.5rem]">
                              <div className="space-y-2">
                                <Label htmlFor={`place-${row.key}`}>{t("placeLabel")}</Label>
                                <Input
                                  id={`place-${row.key}`}
                                  maxLength={500}
                                  placeholder={t("placePlaceholder")}
                                  value={row.interpreting_place}
                                  onChange={(e) => change({ interpreting_place: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`place-date-${row.key}`}>{t("placeDate")}</Label>
                                <Input
                                  id={`place-date-${row.key}`}
                                  type="date"
                                  value={row.interpreting_date}
                                  onChange={(e) => change({ interpreting_date: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`place-time-${row.key}`}>{t("placeTime")}</Label>
                                <Input
                                  id={`place-time-${row.key}`}
                                  type="time"
                                  value={row.interpreting_time}
                                  onChange={(e) => change({ interpreting_time: e.target.value })}
                                />
                              </div>
                            </div>
                          )}
                          {otherErrors.length > 0 && (
                            <p className="text-destructive mt-2 text-xs">{otherErrors.join(" ")}</p>
                          )}
                        </Band>

                        {/* Who does it. A notary only where there is something
                            to notarise: assigning one otherwise would be paid
                            a fee for nothing. */}
                        {(canAssignTranslators || notarised) && (
                          <Band icon={UsersRound} hue="violet">
                            <div className="grid gap-3 sm:grid-cols-2">
                              {canAssignTranslators && (
                                <div className="space-y-2">
                                  <Label htmlFor={`translator-${row.key}`}>{t("translator")}</Label>
                                  <select
                                    id={`translator-${row.key}`}
                                    className={selectClass}
                                    value={row.translator_id ?? ""}
                                    onChange={(e) => {
                                      if (e.target.value === ADD_NEW) {
                                        e.target.value = String(row.translator_id ?? "");
                                        translatorAdd.openFor(row.key);
                                        return;
                                      }
                                      change({
                                        translator_id: e.target.value ? Number(e.target.value) : null,
                                      });
                                    }}
                                  >
                                    <option value="">{t("unassigned")}</option>
                                    {translatorOptions.map((person) => (
                                      <option key={person.id} value={person.id}>
                                        {canSeeCosts && person.default_rate
                                          ? t("translatorWithRate", {
                                              name: person.name,
                                              rate: formatMoneyString(person.default_rate),
                                            })
                                          : person.name}
                                      </option>
                                    ))}
                                    {canCreateTranslators && (
                                      <option value={ADD_NEW}>+ {t("addTranslator")}</option>
                                    )}
                                  </select>
                                  <TranslatorFit
                                    person={
                                      row.translator_id !== null
                                        ? translatorById.get(row.translator_id)
                                        : undefined
                                    }
                                    notarised={notarised}
                                    source={row.source_language}
                                    target={row.target_language}
                                    languageName={languageName}
                                  />
                                </div>
                              )}

                              {notarised && (
                                <div className="animate-in fade-in-0 slide-in-from-left-2 space-y-2 duration-200">
                                  <Label htmlFor={`notary-${row.key}`} className="text-hue-plum-ink">
                                    {t("notary")}
                                  </Label>
                                  <select
                                    id={`notary-${row.key}`}
                                    className={selectClass}
                                    value={row.notary_id ?? ""}
                                    onChange={(e) => {
                                      if (e.target.value === ADD_NEW) {
                                        e.target.value = String(row.notary_id ?? "");
                                        notaryAdd.openFor(row.key);
                                        return;
                                      }
                                      change({
                                        notary_id: e.target.value ? Number(e.target.value) : null,
                                      });
                                    }}
                                  >
                                    <option value="">{t("unassigned")}</option>
                                    {notaryOptions.map((person) => (
                                      <option key={person.id} value={person.id}>
                                        {person.name}
                                      </option>
                                    ))}
                                    {canCreateNotaries && (
                                      <option value={ADD_NEW}>+ {t("addNotary")}</option>
                                    )}
                                  </select>
                                </div>
                              )}
                            </div>
                          </Band>
                        )}

                        {/* Its files: what is stored already, what goes up on
                            Save, and where to add more. */}
                        <Band icon={Paperclip} hue="amber">
                          <div className="space-y-2">
                            {row.id !== undefined && existingFiles === null && (
                              <p className="text-muted-foreground text-xs">{t("filesUnavailable")}</p>
                            )}
                            {fileCount > 0 && (
                              <ul className="space-y-1.5" aria-label={t("fileCount", { count: fileCount })}>
                                {stored.map((file) => (
                                  <FileChip
                                    key={file.id}
                                    name={file.name}
                                    contentType={file.content_type}
                                    note={[tf(file.kind), formatFileSize(file.size_bytes)]
                                      .filter(Boolean)
                                      .join(" · ")}
                                    state={{ hue: "green", icon: Check, label: t("fileSaved") }}
                                    href={
                                      order && file.downloadable !== false
                                        ? withBasePath(`/api/files/${order.id}/${row.id}/${encodeURIComponent(file.id)}`)
                                        : undefined
                                    }
                                  />
                                ))}
                                {row.files.map((file) => (
                                  <FileChip
                                    key={`${file.name}:${file.size}:${file.lastModified}`}
                                    name={file.name}
                                    contentType={file.type}
                                    note={formatFileSize(file.size)}
                                    state={stateOf(file)}
                                    arriving
                                    removeLabel={tf("clearFile", { name: file.name })}
                                    onRemove={
                                      uploading
                                        ? undefined
                                        : () =>
                                            update(row.key, {
                                              files: row.files.filter((kept) => kept !== file),
                                            })
                                    }
                                  />
                                ))}
                              </ul>
                            )}
                            {/* A button, which takes a drop too. */}
                            <FileDrop
                              id={`file-${row.key}`}
                              size="sm"
                              title={t("addFile")}
                              disabled={uploading !== null}
                              onFiles={(files) => attach(row.key, files)}
                            />
                          </div>
                        </Band>

                        {/* The money, when someone wants to change it. The
                            calculated figure sits under each box in words: as
                            a placeholder it read as a value already typed. */}
                        {showAdjust && (
                          <Band
                            icon={Coins}
                            hue="green"
                            className="animate-in fade-in-0 slide-in-from-top-1 duration-200"
                          >
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="space-y-1.5">
                                <Label htmlFor={`price-${row.key}`} className={moneyLabelClass}>
                                  {t("priceOverride")}
                                </Label>
                                <Input
                                  id={`price-${row.key}`}
                                  inputMode="decimal"
                                  value={shownPrice}
                                  className={cn(
                                    autoPrice !== null &&
                                      "border-status-warning bg-status-warning/10 focus-visible:ring-status-warning/30",
                                  )}
                                  aria-invalid={
                                    priceErrors.length > 0 ||
                                    (Boolean(row.price_override.trim()) &&
                                      override(row.price_override) === null)
                                  }
                                  aria-describedby={
                                    [
                                      priceErrors.length > 0 ? `price-${row.key}-error` : null,
                                      autoPrice !== null ? `price-auto-${row.key}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" ") || undefined
                                  }
                                  onChange={(e) => change({ price_override: e.target.value })}
                                />
                                {line && autoPrice === null && (
                                  <p className="text-muted-foreground text-xs tabular-nums">
                                    {t("calculated", { amount: formatMoneyString(line.price) })}
                                  </p>
                                )}
                                <FieldError id={`price-${row.key}`} messages={priceErrors} />
                              </div>
                              {canSeeCosts && canAssignTranslators && (
                                <div className="space-y-1.5">
                                  <Label htmlFor={`tcost-${row.key}`} className={moneyLabelClass}>
                                    {t("translatorCostOverride")}
                                  </Label>
                                  <Input
                                    id={`tcost-${row.key}`}
                                    inputMode="decimal"
                                    value={row.translator_cost_override}
                                    {...invalidProps(`tcost-${row.key}`, translatorCostErrors)}
                                    onChange={(e) => change({ translator_cost_override: e.target.value })}
                                  />
                                  {(rateDefault !== null || line?.translator_cost) && (
                                    <p className="text-muted-foreground text-xs tabular-nums">
                                      {t("calculated", {
                                        amount:
                                          rateDefault !== null
                                            ? money(rateDefault)
                                            : formatMoneyString(line?.translator_cost ?? "0"),
                                      })}
                                    </p>
                                  )}
                                  <FieldError id={`tcost-${row.key}`} messages={translatorCostErrors} />
                                </div>
                              )}
                              {canSeeCosts && notarised && (
                                <div className="space-y-1.5">
                                  <Label htmlFor={`ncost-${row.key}`} className={moneyLabelClass}>
                                    {t("notaryCostOverride")}
                                  </Label>
                                  <Input
                                    id={`ncost-${row.key}`}
                                    inputMode="decimal"
                                    value={row.notary_cost_override}
                                    {...invalidProps(`ncost-${row.key}`, notaryCostErrors)}
                                    onChange={(e) => change({ notary_cost_override: e.target.value })}
                                  />
                                  {line && (
                                    <p className="text-muted-foreground text-xs tabular-nums">
                                      {t("calculated", { amount: formatMoneyString(line.notary_cost) })}
                                    </p>
                                  )}
                                  <FieldError id={`ncost-${row.key}`} messages={notaryCostErrors} />
                                </div>
                              )}
                            </div>
                            {autoPrice !== null ? (
                              <p
                                id={`price-auto-${row.key}`}
                                className="border-status-warning/40 bg-status-warning/10 mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
                              >
                                <AlertTriangle className="text-status-warning mt-0.5 size-3.5 shrink-0" />
                                <span>{t("autoFilledPrice")}</span>
                              </p>
                            ) : (
                              line && (
                                <p className="text-muted-foreground mt-3 text-xs tabular-nums">
                                  {line.character_count && line.standard_pages
                                    ? t("standardPagesLine", {
                                        rate: formatMoneyString(line.base_rate_per_page),
                                        count: Number(line.standard_pages).toFixed(2),
                                      })
                                    : t(oral ? "minutesLine" : "pagesLine", {
                                        rate: formatMoneyString(line.base_rate_per_page),
                                        count: line.page_count,
                                      })}
                                  {!oral && line.document_type_multiplier !== "1.000" &&
                                    ` × ${line.document_type_multiplier}`}
                                  {line.urgency_multiplier !== "1.000" &&
                                    ` × ${line.urgency_multiplier}`}
                                  {line.is_notarized &&
                                    ` + ${t("notaryLine", { amount: formatMoneyString(line.notary_cost) })}`}
                                </p>
                              )
                            )}
                          </Band>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {!allOral && (
            <Card className={sectionCardClass}>
              <SectionHeader icon={Truck} hue="yellow">
                {t("handover")}
              </SectionHeader>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap gap-2">
                  {reference.handover_methods.map((option) => {
                    const Mark = HANDOVER_ICON[option.value];
                    const chosen = handover === option.value;
                    return (
                      <ToggleChip
                        key={option.value}
                        pressed={chosen}
                        className={cn(
                          "flex flex-1 items-center gap-3 px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow] duration-200",
                          chosen ? "shadow-md" : "hover:shadow-sm",
                        )}
                        onClick={() => setHandover(option.value as HandoverMethod)}
                      >
                        {Mark && (
                          <Mark
                            className={cn("size-5 shrink-0", !chosen && "text-hue-yellow-ink")}
                            aria-hidden
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block font-medium">{enumLabel("handover", option)}</span>
                          {option.extra_cost && option.extra_cost !== "0.00" && (
                            <span className="text-xs opacity-80">
                              +{formatMoneyString(option.extra_cost)}
                            </span>
                          )}
                        </span>
                      </ToggleChip>
                    );
                  })}
                </div>

                {/* Only rendered for courier, where it is required — an address
                    box on a scan handover invites data nobody will read. */}
                {handover === "delivery" && (
                  <div
                    className={cn(
                      "animate-in fade-in-0 slide-in-from-top-1 grid gap-3 duration-200",
                      isEdit && "sm:grid-cols-3",
                    )}
                  >
                    <Field
                      name="delivery_address"
                      label={t("deliveryAddress")}
                      errors={errors.delivery_address}
                      className={cn(isEdit && "sm:col-span-2")}
                    >
                      <Textarea
                        id="delivery_address"
                        name="delivery_address"
                        rows={2}
                        defaultValue={value("delivery_address", order?.delivery_address ?? "")}
                        maxLength={500}
                      />
                    </Field>
                    {isEdit && (
                      <Field
                        name="delivery_cost"
                        label={t("deliveryCost")}
                        errors={errors.delivery_cost}
                        hint={t("deliveryCostHint")}
                      >
                        <Input
                          id="delivery_cost"
                          name="delivery_cost"
                          inputMode="decimal"
                          defaultValue={value("delivery_cost", order?.delivery_cost ?? "")}
                        />
                      </Field>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className={sectionCardClass}>
            {/* The header is the box's label: a label under it would say
                "Internal notes" twice. */}
            <SectionHeader icon={StickyNote} hue="grey">
              <span id="notes-title">{t("internalNotes")}</span>
            </SectionHeader>
            <CardContent className="space-y-2 pt-5">
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                aria-labelledby="notes-title"
                aria-invalid={errors.notes?.length ? true : undefined}
                aria-describedby={errors.notes?.length ? "notes-error" : undefined}
                defaultValue={value("notes", order?.notes ?? "")}
              />
              <FieldError id="notes" messages={errors.notes} />
            </CardContent>
          </Card>

          {claudeTranslate && (
            <Card className={sectionCardClass}>
              <SectionHeader icon={Languages} hue="teal">
                <span id="translation-instructions-title">{t("translationInstructions")}</span>
              </SectionHeader>
              <CardContent className="space-y-2 pt-5">
                <Textarea
                  id="translation_instructions"
                  name="translation_instructions"
                  rows={4}
                  maxLength={5000}
                  aria-labelledby="translation-instructions-title"
                  aria-describedby="translation-instructions-hint"
                  aria-invalid={errors.translation_instructions?.length ? true : undefined}
                  placeholder={t("translationInstructionsPlaceholder")}
                  defaultValue={value(
                    "translation_instructions",
                    order?.translation_instructions ?? "",
                  )}
                />
                <p id="translation-instructions-hint" className="text-muted-foreground text-xs">
                  {t("translationInstructionsHint")}
                </p>
                <FieldError
                  id="translation_instructions"
                  messages={errors.translation_instructions}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          {/* It rides along beside the form, so it stands a little further
              off the page than the cards it passes. */}
          <Card className={cn(sectionCardClass, "shadow-md")}>
            <SectionHeader
              icon={Coins}
              hue="green"
              aside={
                <div className="flex items-center gap-1">
                  {isQuoting && <Loader2 className="text-hue-green-ink size-4 animate-spin" />}
                  {/* How the figures come about is for whoever asks: as a
                      standing paragraph it was the longest text on the page. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("priceNoteToggle")}
                    title={t("priceNoteToggle")}
                    aria-expanded={noteOpen}
                    aria-controls="price-note"
                    onClick={() => setNoteOpen((was) => !was)}
                  >
                    <Info />
                  </Button>
                </div>
              }
            >
              {t("price")}
            </SectionHeader>

            <CardContent className="space-y-3 pt-5">
              {quoteError && (
                <p role="alert" className="text-destructive text-sm">
                  {quoteError}
                </p>
              )}

              {hasAutoPrice && (
                <p className="border-status-warning/40 bg-status-warning/10 flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
                  <AlertTriangle className="text-status-warning mt-0.5 size-3.5 shrink-0" />
                  <span>{t("fallbackWarning")}</span>
                </p>
              )}

              {quote && figures ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("documents")}</dt>
                    <dd className="tabular-nums">{money(figures.documents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("delivery")}</dt>
                    <dd className="tabular-nums">{money(figures.delivery)}</dd>
                  </div>
                  {/* The figure the client pays, in the colour money has. */}
                  <div className="bg-hue-green-tint text-hue-green-ink flex items-baseline justify-between rounded-md px-3 py-2 text-base font-semibold">
                    <dt>{t("total")}</dt>
                    <dd
                      key={figures.total}
                      className={cn("text-xl tabular-nums", figureEnterClass)}
                    >
                      {money(figures.total)}
                    </dd>
                  </div>

                  {/* Notary cost is part of what the client is quoted, not the
                      bureau's margin — the API sends it to everyone. Only
                      translator cost and profit are `reports.profit`. */}
                  <div className="text-muted-foreground space-y-2 pt-1 text-xs">
                    {canSeeCosts && canAssignTranslators && (
                      <div className="flex justify-between">
                        <dt>{t("translatorCost")}</dt>
                        <dd className="tabular-nums">{money(figures.translator)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt>{t("notaryCost")}</dt>
                      <dd className="tabular-nums">{money(figures.notary)}</dd>
                    </div>
                    {canSeeCosts && quote.gross_profit !== null && (
                      <div
                        className={cn(
                          "flex justify-between font-medium",
                          figures.profit < 0 ? "text-hue-red-ink" : "text-hue-green-ink",
                        )}
                      >
                        <dt>{t("grossProfit")}</dt>
                        <dd className="tabular-nums">{money(figures.profit)}</dd>
                      </div>
                    )}
                  </div>
                </dl>
              ) : (
                !quoteError && (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    {t("pickToPrice")}
                  </p>
                )
              )}

              {noteOpen && (
                <p
                  id="price-note"
                  className="text-muted-foreground border-border animate-in fade-in-0 slide-in-from-top-1 border-t pt-3 text-xs duration-200"
                >
                  {/* An edit keeps every stored price it was not asked to
                      change; "priced again when it is created" was the create
                      screen's sentence, wrong here (audit F29). */}
                  {isEdit ? t("edit.previewNote") : t("previewNote")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Below lg the bar at the foot of the form carries the button. */}
          <div className="mt-4 hidden items-center gap-2 lg:flex">
            {uploading ? (
              <Button type="button" variant="brand" disabled>
                <Loader2 className="animate-spin" />
                {t("uploadingFiles", { done: uploading.done, total: uploading.total })}
              </Button>
            ) : (
              <SubmitButton
                label={isEdit ? tc("save") : t("createOrder")}
                icon={isEdit ? <Save /> : <Plus />}
                pending={submitting}
              />
            )}
            <Button variant="ghost" asChild>
              <Link href={order ? `/translations/${order.id}` : "/translations"}>
                {tc("cancel")}
              </Link>
            </Button>
          </div>
          {uploading && (
            <UploadProgress
              done={uploading.done}
              total={uploading.total}
              className="mt-3 hidden lg:block"
            />
          )}
        </div>
      </div>

      {/* Below lg the price card is at the very end of a long form, so the
          total and the button ride along at the bottom of the screen
          instead. Sticky rather than fixed: it stays inside the form's
          column, clear of the sidebar on a tablet. It sticks above the
          phone's bottom bar (--bottom-bar is 0 from md up), not under it.
          On a phone this bar IS the bottom bar: `data-form-bar` hides the
          navigation (globals.css) and zeroes --bottom-bar, so this one sits
          on the screen's edge, clear of the home indicator. */}
      <div
        data-form-bar
        className="bg-background/95 border-border sticky bottom-[var(--bottom-bar)] z-20 -mx-4 mt-6 flex items-center justify-between gap-3 border-t px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_16px_-10px_rgb(0_0_0/0.25)] backdrop-blur md:-mx-6 md:px-6 lg:hidden"
      >
        {uploading && (
          <UploadProgress
            done={uploading.done}
            total={uploading.total}
            className="absolute inset-x-0 top-0 h-0.5 rounded-none"
          />
        )}
        {/* One line: the figure and the button share the row. */}
        <p className="flex min-w-0 items-baseline gap-2">
          <span className="text-muted-foreground text-xs">{t("total")}</span>
          <span
            className={cn(
              "flex items-center gap-2 text-lg font-semibold tabular-nums",
              quote && figures ? "text-hue-green-ink" : "text-muted-foreground",
            )}
          >
            {quote && figures ? money(figures.total) : "–"}
            {isQuoting && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
          </span>
        </p>
        {uploading ? (
          <Button type="button" variant="brand" disabled>
            <Loader2 className="animate-spin" />
            {t("uploadingFiles", { done: uploading.done, total: uploading.total })}
          </Button>
        ) : (
          <SubmitButton
            label={isEdit ? tc("save") : t("createOrder")}
            icon={isEdit ? <Save /> : <Plus />}
            pending={submitting}
          />
        )}
      </div>

      {canManageDocumentTypes && (
        <QuickAddDialog
          key={`doc-type-${docTypeAdd.key}`}
          open={docTypeAdd.open}
          onOpenChange={docTypeAdd.onOpenChange}
          title={tq("documentTypeTitle")}
          description={tq("documentTypeDescription")}
          action={quickCreateDocumentTypeAction}
          onCreated={(type) => {
            setDocumentTypeOptions((current) => [
              ...current,
              {
                id: type.id,
                name_en: type.name_en,
                name_ka: type.name_ka,
                price_multiplier: type.price_multiplier,
              },
            ]);
            if (docTypeAdd.target !== null) {
              update(docTypeAdd.target, { document_type_id: type.id });
            }
          }}
        >
          {(dialogState) => {
            const fieldErrors = dialogState.fieldErrors ?? {};
            return (
              <>
                <Field name="dt_name_ka" label={tq("nameKa")} errors={fieldErrors.name_ka}>
                  <Input
                    id="dt_name_ka"
                    name="name_ka"
                    autoFocus
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name_ka}
                  />
                </Field>
                <Field name="dt_name_en" label={tq("nameEn")} errors={fieldErrors.name_en}>
                  <Input
                    id="dt_name_en"
                    name="name_en"
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name_en}
                  />
                </Field>
              </>
            );
          }}
        </QuickAddDialog>
      )}

      {canCreateTranslators && (
        <QuickAddDialog
          key={`translator-${translatorAdd.key}`}
          open={translatorAdd.open}
          onOpenChange={translatorAdd.onOpenChange}
          title={tq("translatorTitle")}
          description={tq("translatorDescription")}
          action={quickCreateTranslatorAction}
          onCreated={(person) => {
            setTranslatorOptions((current) => [...current, person]);
            if (translatorAdd.target !== null) {
              update(translatorAdd.target, { translator_id: person.id });
            }
          }}
        >
          {(dialogState) => {
            const fieldErrors = dialogState.fieldErrors ?? {};
            const targetRow = rows.find((r) => r.key === translatorAdd.target);
            return (
              <>
                <Field name="tr_name" label={tq("translatorName")} errors={fieldErrors.name}>
                  <Input
                    id="tr_name"
                    name="name"
                    autoFocus
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name}
                  />
                </Field>
                <Field name="tr_phone" label={tq("phone")} errors={fieldErrors.phone}>
                  <Input
                    id="tr_phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder={PHONE_PLACEHOLDER}
                    defaultValue={dialogState.values?.phone}
                  />
                </Field>
                <Field name="tr_email" label={tq("email")} errors={fieldErrors.email}>
                  <Input
                    id="tr_email"
                    name="email"
                    type="email"
                    defaultValue={dialogState.values?.email}
                  />
                </Field>
                <Field
                  name="tr_default_rate"
                  label={tq("defaultRate")}
                  errors={fieldErrors.default_rate}
                  hint={tq("defaultRateHint")}
                >
                  <Input
                    id="tr_default_rate"
                    name="default_rate"
                    inputMode="decimal"
                    defaultValue={dialogState.values?.default_rate}
                  />
                </Field>
                {/* The document they are being added for already says what
                    they will do: its pair, oral or written, and whether it
                    goes to a notary. Each can be changed here. */}
                <Field name="tr_work_kind" label={tq("work")}>
                  <select
                    id="tr_work_kind"
                    name="work_kind"
                    className={selectClass}
                    defaultValue={
                      dialogState.values?.work_kind ??
                      (targetRow?.service_type === "oral" ? "oral" : "written")
                    }
                  >
                    {WORK_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {tq(`workKind.${kind}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  name="tr_pairs"
                  label={tq("pairs")}
                  errors={fieldErrors.language_pairs}
                >
                  <LanguagePairsField
                    name="language_pairs"
                    languages={reference.languages}
                    showRate={false}
                    initial={[
                      {
                        source_language: targetRow?.source_language ?? "",
                        target_language: targetRow?.target_language ?? "",
                      },
                    ]}
                    invalid={Boolean(fieldErrors.language_pairs?.length)}
                  />
                </Field>
                <Field name="tr_city" label={tq("city")} errors={fieldErrors.cities}>
                  <select
                    id="tr_city"
                    name="city"
                    className={selectClass}
                    defaultValue={dialogState.values?.city ?? ""}
                  >
                    <option value="">–</option>
                    {CITY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {tcity(code)}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tr_can_notarize"
                    name="can_notarize"
                    defaultChecked={targetRow ? isNotarised(targetRow) : false}
                  />
                  <Label htmlFor="tr_can_notarize" className="font-normal">
                    {tq("canNotarize")}
                  </Label>
                </div>
              </>
            );
          }}
        </QuickAddDialog>
      )}

      {canCreateNotaries && (
        <QuickAddDialog
          key={`notary-${notaryAdd.key}`}
          open={notaryAdd.open}
          onOpenChange={notaryAdd.onOpenChange}
          title={tq("notaryTitle")}
          description={tq("notaryDescription")}
          action={quickCreateNotaryAction}
          onCreated={(person) => {
            setNotaryOptions((current) => [...current, person]);
            if (notaryAdd.target !== null) {
              update(notaryAdd.target, { notary_id: person.id });
            }
          }}
        >
          {(dialogState) => {
            const fieldErrors = dialogState.fieldErrors ?? {};
            return (
              <>
                <Field name="nt_name" label={tq("notaryName")} errors={fieldErrors.name}>
                  <Input
                    id="nt_name"
                    name="name"
                    autoFocus
                    required
                    maxLength={255}
                    defaultValue={dialogState.values?.name}
                  />
                </Field>
                <Field name="nt_phone" label={tq("phone")} errors={fieldErrors.phone}>
                  <Input
                    id="nt_phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder={PHONE_PLACEHOLDER}
                    defaultValue={dialogState.values?.phone}
                  />
                </Field>
                <Field name="nt_email" label={tq("email")} errors={fieldErrors.email}>
                  <Input
                    id="nt_email"
                    name="email"
                    type="email"
                    defaultValue={dialogState.values?.email}
                  />
                </Field>
              </>
            );
          }}
        </QuickAddDialog>
      )}
    </form>
  );
}
