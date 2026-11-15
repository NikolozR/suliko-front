// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ArrowLeftRight, ArrowRight } from "lucide-react";

import { translatorWork, type TranslatorSummary } from "@office/features/directory/types";
import { groupPairs } from "@office/features/translators/pairs";
import { cn } from "@office/shared/lib/utils";

/**
 * A pair as a compact chip: KA <-> EN, or KA → EN for the rare one-way pair.
 * Codes, not names: it sits in tables.
 */
export function PairChip({
  source,
  target,
  oneWay = false,
}: {
  source: string;
  target: string;
  oneWay?: boolean;
}) {
  const Arrow = oneWay ? ArrowRight : ArrowLeftRight;
  return (
    <span className="bg-hue-violet-tint text-hue-violet-ink inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold uppercase">
      {source}
      <Arrow className="size-3" aria-hidden />
      {target}
    </span>
  );
}

function Tag({ tone, children }: { tone: "plum" | "amber" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "plum" && "bg-hue-plum-tint text-hue-plum-ink",
        tone === "amber" && "bg-hue-amber-tint text-hue-amber-ink",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/**
 * What a translator can be given, at a glance: their pairs, then a tag for
 * notarisation and for interpreting. Written-only, the old default, gets no
 * tag of its own; oral-only says so.
 */
export function TranslatorWork({
  translator,
  labels,
  max = 3,
}: {
  translator: TranslatorSummary;
  labels: { notary: string; oral: string; oralOnly: string; none: string };
  /** Pairs shown before the rest fold into "+N". */
  max?: number;
}) {
  const work = translatorWork(translator);
  // One chip per pair: the two directions a translator works in are one pair.
  const pairs = groupPairs(work.pairs);
  const shown = pairs.slice(0, max);
  const more = pairs.length - shown.length;
  const empty = pairs.length === 0 && !work.canNotarize && !work.oral;
  if (empty) return <span className="text-muted-foreground text-xs">{labels.none}</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((p) => (
        <PairChip
          key={`${p.source_language}-${p.target_language}`}
          source={p.source_language}
          target={p.target_language}
          oneWay={p.one_way}
        />
      ))}
      {more > 0 && <Tag tone="muted">+{more}</Tag>}
      {work.canNotarize && <Tag tone="plum">{labels.notary}</Tag>}
      {work.oral && <Tag tone="amber">{work.written ? labels.oral : labels.oralOnly}</Tag>}
    </span>
  );
}
