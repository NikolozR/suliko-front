// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getOrder } from "@office/features/orders/api";
import { EditorUnavailable } from "@office/features/orders/components/editor-unavailable";
import { TranslationWorkspace } from "@office/features/orders/components/translation-workspace";
import { loadEditorDocument } from "@office/features/orders/editor-page";
import { listDocumentFiles } from "@office/features/orders/files";
import { isEditableTranslation } from "@office/features/orders/translation-file";
import { listTranslations } from "@office/features/orders/translations";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { orderNumberOf, pageTitle } from "@office/shared/lib/page-title";
import { tolerate } from "@office/shared/lib/tolerate";
import { listClaudeJobsIfAvailable } from "@office/features/orders/claude";
import { withBasePath } from "@office/shared/lib/base-path";

interface PageProps {
  params: Promise<{ locale: string; id: string; documentId: string; fileId: string }>;
}

export const generateMetadata = pageTitle("order", orderNumberOf, "orders");

/**
 * A translation, read beside its original and corrected in the Word editor.
 *
 * Reached from the order's Files card, for a translation that is a Word
 * document (or an HTML file from before there were Word ones), whoever added
 * it. Anything else under this address is a 404: a PDF translation is
 * downloaded, not edited here.
 */
export default async function TranslationPage({ params }: PageProps) {
  const { locale, id, documentId: rawDocument, fileId } = await params;
  setRequestLocale(locale);

  if (!/^\d{1,10}$/.test(id) || !/^\d{1,10}$/.test(rawDocument)) notFound();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(fileId)) notFound();
  const orderId = Number(id);
  const documentId = Number(rawDocument);

  const session = await requirePermission("orders.read", locale);
  const t = await getTranslations("files.workspace");

  let order;
  try {
    order = await getOrder(orderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const document = order.documents.find((doc) => doc.id === documentId);
  if (!document) notFound();

  // The translations first, then the files: asking about them is what brings
  // a finished translation's file over, so a file list read at the same time
  // may not have it yet and the page would answer 404 for a file that is there.
  // (The order's Files panel reads them in this order for the same reason.)
  const jobs = await tolerate(listTranslations(orderId, documentId));
  const files = await tolerate(listDocumentFiles(orderId, documentId));
  const file = files.data?.find((candidate) => candidate.id === fileId);
  // The list could not be read at all: say so, rather than claim the page is gone.
  const unreadable = !files.data;
  if (!unreadable && (!file || !isEditableTranslation(file))) notFound();
  const opened = unreadable
    ? ({ failure: "unavailable" } as const)
    : await loadEditorDocument(orderId, documentId, fileId);

  // The original: the file this translation was made from. When that is no
  // longer known (it was uploaded, or its source was removed), the
  // document's first source file stands in.
  const sources = (files.data ?? []).filter(
    (candidate) => candidate.kind === "source" && candidate.downloadable !== false,
  );
  // Claude's translations are a separate list from Suliko Translate's.
  const claudeJobs = await listClaudeJobsIfAvailable(orderId);
  const madeFrom =
    jobs.data?.find((job) => job.result_file_id === fileId)?.source_file_id ??
    claudeJobs?.jobs.find((job) => job.result_file_id === fileId)?.file_id;
  const source = sources.find((candidate) => candidate.id === madeFrom) ?? sources[0] ?? null;

  const typeName =
    (locale === "ka"
      ? document.document_type_name_ka || document.document_type_name
      : document.document_type_name) ?? "";
  const backHref = `/translations/${order.id}#files`;

  return (
    <>
      <PageHeader
        {...sectionMark("translations")}
        title={t("title", { id: order.number })}
        description={[typeName, order.client_name].filter(Boolean).join(" · ")}
        actions={<BackLink href={backHref} label={t("back")} />}
      />
      {"failure" in opened || !file ? (
        <EditorUnavailable
          reason={"failure" in opened ? opened.failure : "unavailable"}
          downloadHref={withBasePath(`/api/files/${orderId}/${documentId}/${encodeURIComponent(fileId)}`)}
          backHref={backHref}
        />
      ) : (
        <TranslationWorkspace
          // A save makes a new file: start the workspace afresh on it.
          key={file.id}
          orderId={orderId}
          documentId={documentId}
          file={{ id: file.id, name: file.name }}
          source={
            source ? { id: source.id, name: source.name, contentType: source.content_type } : null
          }
          sfdt={opened.sfdt}
          canWrite={session.permissions.includes("orders.write")}
        />
      )}
    </>
  );
}
