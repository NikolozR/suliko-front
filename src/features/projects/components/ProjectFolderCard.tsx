"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDroppable } from "@dnd-kit/core";
import { Folder, FileText, Pencil, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import { cn } from "@/shared/lib/utils";
import type { Project } from "../types/types.Project";
import { CardMenu } from "./CardMenu";
import { RenameProjectDialog } from "./RenameProjectDialog";

interface ProjectFolderCardProps {
  project: Project;
  onRename: (id: string, name: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function ProjectFolderCard({ project, onRename, onDelete }: ProjectFolderCardProps) {
  const t = useTranslations("Projects");
  const [showRename, setShowRename] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: project.id });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(project.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          "relative rounded-xl transition-shadow",
          isOver && "ring-2 ring-suliko-default-color ring-offset-2 ring-offset-background"
        )}
      >
        <Card className="relative p-4 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-[border-color,box-shadow] group">
          <Link
            href={`/projects/${project.id}`}
            className="absolute inset-0 z-0"
            aria-label={project.name}
          />
          <div className="flex items-center gap-4 relative pointer-events-none">
            <div className="p-2.5 rounded-lg shrink-0 bg-amber-50 dark:bg-amber-950/40">
              <Folder className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <FileText className="h-3 w-3" />
                <span>{project.translationCount}</span>
              </div>
            </div>
            <div className="relative z-10 pointer-events-auto">
              <CardMenu
                items={[
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
        </Card>
      </div>

      <RenameProjectDialog
        open={showRename}
        onOpenChange={setShowRename}
        currentName={project.name}
        onRename={(name) => onRename(project.id, name)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("deleteProject")}
        description={t("deleteProjectWarning", { count: project.translationCount })}
        confirmLabel={t("delete")}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
