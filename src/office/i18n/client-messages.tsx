// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

/**
 * Which messages reach the browser.
 *
 * `NextIntlClientProvider` without a `messages` prop ships the WHOLE
 * catalogue, both languages' worth of every screen, inline in every page:
 * 283 KB of HTML for one order, superuser-only Platform strings included
 * on a Freelancer's screen (audit F06). Server components read messages on
 * the server and need none of this; only client components do.
 *
 * SHARED is what the shell and the shared form pieces use on every page.
 * Each section's layout adds what its own client components use (`extra`).
 * A dotted entry picks just those keys: the shared FormAlert needs one auth
 * string, not the 19 KB auth namespace.
 *
 * Adding `useTranslations("x")` to a client component? Make sure "x" is in
 * SHARED or in the `extra` of every section that renders it. A miss shows
 * up as MISSING_MESSAGE in the browser console and the key on screen.
 */
const SHARED = [
  "account",
  "common",
  "confirm",
  "enums",
  "errors",
  "flash",
  "forms",
  "nav",
  "options",
  "shell",
  "states",
  "statuses",
  "tips",
  "unsaved",
  // FormAlert's step-up link and the shell's "new organisation" dialog.
  "auth.stepUpTitle",
  "auth.signupOrganisation",
  "auth.signupOrganisationHint",
];

/** `messages` cut down to `paths`: whole namespaces, or dotted keys within one. */
export function pickMessages(
  messages: AbstractIntlMessages,
  paths: readonly string[],
): AbstractIntlMessages {
  const whole = new Set(paths.filter((path) => !path.includes(".")));
  const out: AbstractIntlMessages = {};
  for (const namespace of whole) {
    if (namespace in messages) out[namespace] = messages[namespace];
  }
  for (const path of paths) {
    const [namespace, ...keys] = path.split(".");
    if (!keys.length || whole.has(namespace)) continue;
    let from: unknown = messages[namespace];
    let into = (out[namespace] ??= {}) as AbstractIntlMessages;
    keys.forEach((key, index) => {
      from = (from as AbstractIntlMessages | undefined)?.[key];
      if (from === undefined) return;
      if (index === keys.length - 1) {
        into[key] = from as AbstractIntlMessages[string];
      } else {
        into = (into[key] ??= {}) as AbstractIntlMessages;
      }
    });
  }
  return out;
}

/** The provider for a part of the app: SHARED plus that part's own namespaces. */
export async function ClientMessages({
  locale,
  extra = [],
  children,
}: {
  locale: string;
  extra?: readonly string[];
  children: ReactNode;
}) {
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  return (
    <NextIntlClientProvider messages={pickMessages(messages, [...SHARED, ...extra])}>
      {children}
    </NextIntlClientProvider>
  );
}
