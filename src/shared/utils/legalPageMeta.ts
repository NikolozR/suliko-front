/**
 * Canonical URL for a public legal page.
 *
 * Both domains serve the same documents, so each locale is pointed at the domain
 * it belongs to rather than letting the two compete for the same canonical.
 */
export function canonicalFor(locale: string, path: string): string {
  const domain =
    locale === "ka"
      ? "https://suliko.ge"
      : locale === "en"
      ? "https://suliko.io"
      : "https://suliko.ge/pl";

  return `${domain}${path}`;
}
