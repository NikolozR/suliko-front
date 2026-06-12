"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Folder, FolderOpen } from "lucide-react";
import type { Project } from "../types/types.Project";

interface MoveToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  currentProjectId?: string | null;
  onSelect: (projectId: string | null) => void;
}

export function MoveToProjectDialog({
  open,
  onOpenChange,
  projects,
  currentProjectId,
  onSelect,
}: MoveToProjectDialogProps) {
  const t = useTranslations("Projects");

  const handleSelect = (projectId: string | null) => {
    onSelect(projectId);
    onOpenChange(false);
  };

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("moveToProject")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {currentProjectId && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left text-sm"
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{t("moveToRoot")}</span>
            </button>
          )}
          {otherProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => handleSelect(project.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left text-sm"
            >
              <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{project.name}</span>
            </button>
          ))}
          {otherProjects.length === 0 && !currentProjectId && (
            <p className="text-sm text-muted-foreground px-3 py-2">{t("noProjects")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
