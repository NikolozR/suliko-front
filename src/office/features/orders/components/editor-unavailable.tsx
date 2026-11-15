// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle, Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";

/**
 * What is shown in place of the editor when the document cannot be opened in it:
 * why, and the two things that still work, downloading the file and going back.
 */
export async function EditorUnavailable({
  reason,
  downloadHref,
  backHref,
}: {
  reason: "unavailable" | "unreadable";
  downloadHref: string;
  backHref: string;
}) {
  const t = await getTranslations("files.workspace");
  return (
    <div className="border-hue-amber-ink/30 bg-hue-amber-tint mx-auto flex max-w-xl flex-col gap-3 rounded-lg border p-5 text-sm">
      <p className="flex items-start gap-2 font-medium">
        <AlertTriangle className="text-hue-amber-ink mt-0.5 size-4 shrink-0" aria-hidden />
        {reason === "unavailable" ? t("editorUnavailable") : t("editorUnreadable")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={downloadHref}>
            <Download /> {t("downloadTranslation")}
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>{t("back")}</Link>
        </Button>
      </div>
    </div>
  );
}
