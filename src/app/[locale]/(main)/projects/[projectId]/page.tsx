"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, AlertCircle, BookText, Folder, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import { cn } from "@/shared/lib/utils";
import {
  getProjectById,
  getProjects,
  renameProject,
  deleteProject,
} from "@/features/projects";
import type { Project, ProjectDetailed } from "@/features/projects";
import { deleteChat, moveChatToProject } from "@/features/chatHistory";
import type { Chat } from "@/features/chatHistory";
import { TranslationCard } from "@/features/projects/components/TranslationCard";
import { RenameProjectDialog } from "@/features/projects/components/RenameProjectDialog";
import { CardMenu } from "@/features/projects/components/CardMenu";
import { ProjectNamesDialog } from "@/features/projects/components/ProjectNamesDialog";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const router = useRouter();
  const t = useTranslations("Projects");

  const [project, setProject] = useState<ProjectDetailed | null>(null);
  const [translations, setTranslations] = useState<Chat[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRename, setShowRename] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projectRes, projectsRes] = await Promise.all([
        getProjectById(projectId),
        getProjects(),
      ]);
      setProject(projectRes.data);
      setTranslations(projectRes.data.translations);
      setAllProjects(projectsRes.data.filter((p) => p.id !== projectId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, 5000);
    const onRefresh = () => fetchData();
    window.addEventListener("focus", onRefresh);
    window.addEventListener("translations-updated", onRefresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("translations-updated", onRefresh);
    };
  }, [fetchData]);

  const handleRename = async (name: string) => {
    if (!projectId) return;
    await renameProject(projectId, name);
    setProject((prev) => (prev ? { ...prev, name } : prev));
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await deleteProject(projectId);
      router.push("/projects");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId);
    setTranslations((prev) => prev.filter((c) => c.chatId !== chatId));
  };

  const handleMoveChat = async (chatId: string, targetProjectId: string | null) => {
    await moveChatToProject(chatId, targetProjectId);
    setTranslations((prev) => prev.filter((c) => c.chatId !== chatId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id !== "root") return;
    handleMoveChat(String(active.id), null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-8 w-56 mb-8" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 border border-border/60">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="h-6 w-20 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error || t("noProjects")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <RootDropZone>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 -mx-1 rounded mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("backToProjects")}
          </Link>
        </RootDropZone>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg shrink-0 bg-amber-50 dark:bg-amber-950/40">
              <Folder className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight truncate">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild size="sm" className="gap-2">
              <Link
                href={{
                  pathname: "/document",
                  query: { projectId: project.id, projectName: project.name },
                }}
              >
                <Plus className="h-4 w-4" />
                {t("addTranslation")}
              </Link>
            </Button>
            <CardMenu
              items={[
                {
                  label: t("manageNames"),
                  icon: BookText,
                  onClick: () => setShowNames(true),
                },
                {
                  label: t("rename"),
                  icon: Pencil,
                  onClick: () => setShowRename(true),
                },
                {
                  label: t("deleteProject"),
                  icon: Trash2,
                  destructive: true,
                  onClick: () => setShowDeleteConfirm(true),
                },
              ]}
            />
          </div>
        </div>

        {translations.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("noTranslationsInProject")}</p>
            <Button asChild size="sm" className="gap-2">
              <Link
                href={{
                  pathname: "/document",
                  query: { projectId: project.id, projectName: project.name },
                }}
              >
                <Plus className="h-4 w-4" />
                {t("addTranslation")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {translations.map((chat) => (
              <TranslationCard
                key={chat.chatId}
                chat={chat}
                projects={allProjects}
                onDelete={handleDeleteChat}
                onMove={handleMoveChat}
              />
            ))}
          </div>
        )}
      </DndContext>

      <RenameProjectDialog
        open={showRename}
        onOpenChange={setShowRename}
        currentName={project.name}
        onRename={handleRename}
      />

      {projectId && (
        <ProjectNamesDialog
          open={showNames}
          onOpenChange={setShowNames}
          projectId={projectId}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("deleteProject")}
        description={t("deleteProjectWarning", { count: translations.length })}
        confirmLabel={t("delete")}
        loading={deleting}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}

function RootDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "root" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "inline-flex rounded-md transition-shadow",
        isOver && "ring-2 ring-suliko-default-color ring-offset-2 ring-offset-background"
      )}
    >
      {children}
    </div>
  );
}
