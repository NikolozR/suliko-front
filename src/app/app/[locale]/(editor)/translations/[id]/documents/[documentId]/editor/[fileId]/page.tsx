// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getOrder } from "@office/features/orders/api";
import { EditorUnavailable } from "@office/features/orders/components/editor-unavailable";
import { TranslationScreen } from "@office/features/orders/components/translation-screen";
import { loadEditorDocument } from "@office/features/orders/editor-page";
import { listDocumentFiles } from "@office/features/orders/files";
import { isEditableTranslation } from "@office/features/orders/translation-file";
import { listTranslations } from "@office/features/orders/translations";
import { requirePermission } from "@office/shared/auth/guards";
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
 * A translation in the full-screen Word editor: the whole window, the whole
 * ribbon. The original is hidden until it is asked for.
 *
 * The same files open here as on the comparison page; anything else is a 404.
 */
export default async function TranslationEditorPage({ params }: PageProps) {
  const { locale, id, documentId: rawDocument, fileId } = await params;
  setRequestLocale(locale);

  if (!/^\d{1,10}$/.test(id) || !/^\d{1,10}$/.test(rawDocument)) notFound();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(fileId)) notFound();
  const orderId = Number(id);
  const documentId = Number(rawDocument);

  const session = await requirePermission("orders.read", locale);

  let order;
  try {
    order = await getOrder(orderId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (!order.documents.some((doc) => doc.id === documentId)) notFound();

  const [files, jobs] = await Promise.all([
    tolerate(listDocumentFiles(orderId, documentId)),
    tolerate(listTranslations(orderId, documentId)),
  ]);
  const file = files.data?.find((candidate) => candidate.id === fileId);
  if (!file || !isEditableTranslation(file)) notFound();
  const opened = await loadEditorDocument(orderId, documentId, fileId);

  if ("failure" in opened) {
    return (
      <div className="p-6">
        <EditorUnavailable
          reason={opened.failure}
          downloadHref={withBasePath(`/api/files/${orderId}/${documentId}/${encodeURIComponent(fileId)}`)}
          backHref={`/translations/${orderId}#files`}
        />
      </div>
    );
  }

  const sources = (files.data ?? []).filter(
    (candidate) => candidate.kind === "source" && candidate.downloadable !== false,
  );
  // Claude's translations are a separate list from Suliko Translate's.
  const claudeJobs = await listClaudeJobsIfAvailable(orderId);
  const madeFrom =
    jobs.data?.find((job) => job.result_file_id === fileId)?.source_file_id ??
    claudeJobs?.jobs.find((job) => job.result_file_id === fileId)?.file_id;
  const source = sources.find((candidate) => candidate.id === madeFrom) ?? sources[0] ?? null;

  return (
    <TranslationScreen
      // A save makes a new file: start the screen afresh on it.
      key={file.id}
      orderId={orderId}
      orderNumber={order.number}
      documentId={documentId}
      file={{ id: file.id, name: file.name }}
      source={
        source ? { id: source.id, name: source.name, contentType: source.content_type } : null
      }
      sfdt={opened.sfdt}
      canWrite={session.permissions.includes("orders.write")}
    />
  );
}
