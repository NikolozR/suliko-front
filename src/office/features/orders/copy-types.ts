// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { CopyType } from "@office/features/calculator/types";

/**
 * Notarisation is chosen first; the copy type is then one of the kinds that
 * make sense for that choice. The five stored values already encode both:
 *
 *   notarised      → plain copy (`notary_copy`), notary on original, certified copy
 *   not notarised  → plain copy (`plain`), original document
 */
export const NOTARISED_COPY_TYPES: readonly CopyType[] = [
  "notary_copy",
  "notary_original",
  "notary_certified",
];
export const UNNOTARISED_COPY_TYPES: readonly CopyType[] = ["plain", "original"];

export const copyTypeNotarises = (copyType: string) => copyType.startsWith("notary");

/** The copy type that means the same document with notarisation switched on or off. */
export function withNotarisation(copyType: CopyType, notarised: boolean): CopyType {
  if (notarised) {
    if (copyType === "original") return "notary_original";
    if (copyType === "plain") return "notary_copy";
    return copyType;
  }
  if (copyType === "notary_original") return "original";
  if (copyTypeNotarises(copyType)) return "plain";
  return copyType;
}

/**
 * A stored document's copy type with its separate notarised flag folded in.
 * Older documents could carry "original, but notarised"; the form shows that
 * as "notary on original", which is what it was.
 */
export function normaliseCopyType(copyType: CopyType, isNotarized?: boolean | null): CopyType {
  return isNotarized === null || isNotarized === undefined
    ? copyType
    : withNotarisation(copyType, isNotarized);
}
