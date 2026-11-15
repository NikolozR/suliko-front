"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  removeInvoiceTemplateAction,
  uploadInvoiceTemplateAction,
  type TemplateFormState,
} from "@office/features/settings/invoice-template-actions";
import type { InvoiceTemplate } from "@office/features/settings/invoice-template";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { formatFileSize } from "@office/shared/lib/utils";
import { withBasePath } from "@office/shared/lib/base-path";

/** Where a download is forwarded to the API (a route handler, see `app/api`). */
const download = (query: string) => withBasePath(`/api/invoice-template?${query}`);

function UploadButton() {
  const t = useTranslations("settings.invoiceTemplate");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Upload />}
      {t("upload")}
    </Button>
  );
}

function RemoveButton() {
  const t = useTranslations("settings.invoiceTemplate");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      {t("remove")}
    </Button>
  );
}

/**
 * The bureau's own invoice: a Word file with `{{placeholders}}`.
 *
 * Whatever the file draws (logo, stamp, letterhead) stays as it is, so a bureau
 * that needs no logo or stamp simply uploads a file without. With none uploaded
 * invoices keep Suliko Office's own layout. A sample, filled with an invented
 * invoice, lets the file be checked before a client sees it.
 */
export function InvoiceTemplateCard({ initial }: { initial: InvoiceTemplate }) {
  const t = useTranslations("settings.invoiceTemplate");
  const [state, upload] = useActionState<TemplateFormState, FormData>(
    uploadInvoiceTemplateAction,
    {},
  );
  const [removed, remove] = useActionState<TemplateFormState, FormData>(
    () => removeInvoiceTemplateAction(),
    {},
  );
  const [showList, setShowList] = useState(false);
  const template = removed.template ?? state.template ?? initial;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {template.uploaded ? (
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <FileText className="size-4" aria-hidden />
              <span className="font-medium">{template.file_name}</span>
              <span className="text-muted-foreground">
                {formatFileSize(template.size_bytes ?? 0)}
              </span>
            </p>
            {template.unknown.length > 0 && (
              <p role="status" className="text-status-warning text-sm">
                {t("unknown", { names: template.unknown.map((n) => `{{${n}}}`).join(", ") })}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={download("which=sample&locale=ka")}>
                  <Download /> {t("sampleKa")}
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={download("which=sample&locale=en")}>
                  <Download /> {t("sampleEn")}
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <a href={download("which=file")}>
                  <Download /> {t("original")}
                </a>
              </Button>
              <form action={remove}>
                <RemoveButton />
              </form>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("none")}</p>
        )}

        <form action={upload} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            required
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            aria-label={t("file")}
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-transparent file:px-3 file:py-1.5 file:text-sm"
          />
          <UploadButton />
        </form>
        {(state.error || removed.error) && (
          <p role="alert" className="text-destructive text-sm">
            {state.error ?? removed.error}
          </p>
        )}
        {state.ok && !state.error && (
          <p role="status" className="text-status-success text-sm">
            {t("saved")}
          </p>
        )}

        <div>
          <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setShowList((v) => !v)}>
            {showList ? t("hideList") : t("showList")}
          </Button>
          {showList && (
            <div className="mt-2 space-y-2">
              <p className="text-muted-foreground text-xs">{t("howTo")}</p>
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                {template.placeholders.map((p) => (
                  <div key={p.name} className="flex gap-2">
                    <dt className="font-mono text-xs">{`{{${p.name}}}`}</dt>
                    <dd className="text-muted-foreground text-xs">{p.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
