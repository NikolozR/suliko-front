import { ClipboardList, FileText, FolderOpen, Plus, type LucideIcon } from "lucide-react";

import { officePath } from "@office/i18n/office-path";

/**
 * One sidebar for Suliko (phase 3, step 4 of making Translate and Office one
 * system): Translate's screens and Office's show the same two sections in the
 * same order, Translate first, then Office.
 *
 * This file is the Translate section and the two headings, shared by both
 * shells: Translate's (shared/components/Sidebar.tsx) and Office's
 * (office/shared/components/shell/sidebar.tsx). The Office section comes from
 * Office's own NAVIGATION (office/shared/config/navigation.ts), filtered by the
 * person's permissions.
 *
 * The two halves are different root layouts, so a link from one to the other
 * is a plain <a> (a full page load), never a client-side <Link>.
 */

export type WorkspaceLocale = "ka" | "en" | "pl";

type Labels = Record<WorkspaceLocale, string>;

export interface TranslateNavItem {
  /** Path under the locale on suliko.ge: `/text` -> `/ka/text`. */
  href: string;
  label: Labels;
  icon: LucideIcon;
  /** The primary action, drawn as the gradient button. */
  primary?: boolean;
}

export const TRANSLATE_NAV: readonly TranslateNavItem[] = [
  {
    href: "/text",
    label: { ka: "ახალი თარგმანი", en: "New translation", pl: "Nowe tłumaczenie" },
    icon: Plus,
    primary: true,
  },
  { href: "/passport", label: { ka: "პასპორტი", en: "Passport", pl: "Paszport" }, icon: FileText },
  {
    // What bureaus have assigned to this person as a translator. Not "Orders":
    // that is Office's list of the bureau's own orders.
    href: "/assignments",
    label: { ka: "ბიუროების შეკვეთები", en: "Bureau assignments", pl: "Zlecenia od biur" },
    icon: ClipboardList,
  },
  // Last, as on Translate's own sidebar, where it opens the list of projects.
  { href: "/projects", label: { ka: "პროექტები", en: "Projects", pl: "Projekty" }, icon: FolderOpen },
];

export const WORKSPACE_SECTIONS: Record<"translate" | "office", Labels> = {
  translate: { ka: "თარგმნა", en: "Translate", pl: "Tłumaczenie" },
  office: { ka: "ოფისი", en: "Office", pl: "Biuro" },
};

export function workspaceLocale(locale: string): WorkspaceLocale {
  return locale === "en" || locale === "pl" ? locale : "ka";
}

/** Office has Georgian and English only. */
export function officeLocaleOf(locale: string): "ka" | "en" {
  return locale === "en" ? "en" : "ka";
}

/**
 * An Office module's address on suliko.ge: `clients` -> `/ka/clients` once it has
 * moved here, `/app/ka/clients` while the Office deployment answers it.
 * (app.suliko.ge's copy of this file keeps the /app form: it has no moved list.)
 */
export function officeHref(locale: string, module: string): string {
  return officePath(`/${module}`, officeLocaleOf(locale));
}
