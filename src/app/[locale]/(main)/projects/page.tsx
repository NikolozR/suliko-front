"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { getChatHistory, deleteChat, moveChatToProject } from "@/features/chatHistory";
import type { Chat } from "@/features/chatHistory";
import { getProjects, createProject, renameProject, deleteProject } from "@/features/projects";
import type { Project } from "@/features/projects";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { Button } from "@/features/ui/components/ui/button";
import { useTranslations } from "next-intl";
import { Plus, ArrowRight, AlertCircle, FolderPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TranslationCard } from "@/features/projects/components/TranslationCard";
import { ProjectFolderCard } from "@/features/projects/components/ProjectFolderCard";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const t = useTranslations("Projects");

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, chatsRes] = await Promise.all([
        getProjects(),
        getChatHistory({ pageSize: 50, pageNumber: 1, unfiledOnly: true }),
      ]);
      setProjects(projectsRes.data);
      setChats(chatsRes.data.chats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleCreateProject = async (name: string) => {
    const res = await createProject(name);
    setProjects((prev) => [...prev, res.data]);
  };

  const handleRenameProject = async (id: string, name: string) => {
    await renameProject(id, name);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c.chatId !== chatId));
  };

  const handleMoveChat = async (chatId: string, projectId: string | null) => {
    await moveChatToProject(chatId, projectId);
    if (projectId) {
      setChats((prev) => prev.filter((c) => c.chatId !== chatId));
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, translationCount: p.translationCount + 1 } : p))
      );
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    handleMoveChat(String(active.id), String(over.id));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
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

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const isEmpty = projects.length === 0 && chats.length === 0;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Button onClick={() => setShowCreateProject(true)} size="sm" className="gap-2 shrink-0">
          <FolderPlus className="h-4 w-4" />
          {t("newProject")}
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-muted/50 mb-6">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4 max-w-sm">{t("noTranslations")}</p>
          <Link
            href="/document"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {t("title")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="space-y-8">
            {projects.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("folders")}</h2>
                <div className="space-y-3">
                  {projects.map((project) => (
                    <ProjectFolderCard
                      key={project.id}
                      project={project}
                      onRename={handleRenameProject}
                      onDelete={handleDeleteProject}
                    />
                  ))}
                </div>
              </section>
            )}

            {chats.length > 0 && (
              <section>
                {projects.length > 0 && (
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("unfiled")}</h2>
                )}
                <div className="space-y-3">
                  {chats.map((chat) => (
                    <TranslationCard
                      key={chat.chatId}
                      chat={chat}
                      projects={projects}
                      onDelete={handleDeleteChat}
                      onMove={handleMoveChat}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </DndContext>
      )}

      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
