"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, Layers } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { getProjectById } from "@/features/projects";
import { BulkTranslationPanel } from "@/features/bulkTranslation";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export default function BulkTranslationPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  const t = useTranslations("BulkTranslation");
  const [projectName, setProjectName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useDocumentTitle(
    projectName ? `${t("pageTitle")} — ${projectName}` : t("pageTitle")
  );

  useEffect(() => {
    if (!projectId) return;

    getProjectById(projectId)
      .then((response) => setProjectName(response.data.name))
      .catch(() => setProjectName(""))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (!projectId) return null;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Link
        href={`/projects/${projectId}`}
        className="-mx-1 mb-4 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToProject")}
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="shrink-0 rounded-lg bg-suliko-default-color/10 p-2.5">
          <Layers className="h-5 w-5 text-suliko-default-color" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          {loading ? (
            <Skeleton className="mt-1 h-4 w-32" />
          ) : (
            projectName && (
              <p className="truncate text-sm text-muted-foreground">{projectName}</p>
            )
          )}
        </div>
      </div>

      <BulkTranslationPanel projectId={projectId} projectName={projectName} />
    </div>
  );
}
