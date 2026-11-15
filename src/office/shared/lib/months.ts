// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
/**
 * Month names written out. Not `Intl`: whether a runtime has Georgian
 * month names depends on how it was built, and an invoice must not print
 * "October" in a Georgian sentence on someone's machine.
 */
const NAMES = {
  ka: [
    "იანვარი",
    "თებერვალი",
    "მარტი",
    "აპრილი",
    "მაისი",
    "ივნისი",
    "ივლისი",
    "აგვისტო",
    "სექტემბერი",
    "ოქტომბერი",
    "ნოემბერი",
    "დეკემბერი",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
} as const;

/** The twelve month names in order, in `ka` or (for anything else) `en`. */
export function monthNames(locale: string): readonly string[] {
  return locale === "ka" ? NAMES.ka : NAMES.en;
}
