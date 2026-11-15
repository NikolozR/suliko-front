// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { redirectTo } from "@office/i18n/navigation";

/**
 * The admin console used to live at /platform. Old links and bookmarks are
 * sent on to the same screen under /admin.
 */
export default async function OldPlatformPage({
  params,
}: {
  params: Promise<{ locale: string; rest?: string[] }>;
}) {
  const { locale, rest = [] } = await params;
  redirectTo(["/admin", ...rest.map(encodeURIComponent)].join("/"), locale);
}
