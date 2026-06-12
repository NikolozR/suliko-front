"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, FolderInput, GripVertical, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/features/ui/components/ui/card";
import { ConfirmDialog } from "@/features/ui/components/ui/confirm-dialog";
import { cn } from "@/shared/lib/utils";
import type { Chat } from "@/features/chatHistory";
import type { Project } from "../types/types.Project";
import { CardMenu } from "./CardMenu";
import { MoveToProjectDialog } from "./MoveToProjectDialog";
import { getFileConfig, getStatusStyle } from "../utils/fileTypeConfig";

interface TranslationCardProps {
  chat: Chat;
  projects: Project[];
  onDelete: (chatId: string) => Promise<void> | void;
  onMove: (chatId: string, projectId: string | null) => Promise<void> | void;
}

export function TranslationCard({ chat, projects, onDelete, onMove }: TranslationCardProps) {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: chat.chatId,
  });

  const config = getFileConfig(chat.fileType);
  const Icon = config.icon;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(chat.chatId);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform) }}
        className={cn("relative", isDragging && "z-50 opacity-60")}
      >
      <Card className="relative p-4 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-[border-color,box-shadow] group">
        <Link
          href={`/translations/${chat.chatId}`}
          className="absolute inset-0 z-0"
          aria-label={chat.originalFileName || chat.title}
        />
        <div className="flex items-center gap-4 relative pointer-events-none">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="relative z-10 pointer-events-auto cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors touch-none"
            aria-label="Drag to move"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className={`p-2.5 rounded-lg shrink-0 ${config.bg}`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
              {chat.originalFileName || chat.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(chat.lastActivityAt).toLocaleDateString(locale)}
              </span>
              <span className="text-border">|</span>
              <span className="uppercase font-medium tracking-wider">
                {chat.fileType}
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusStyle(chat.status, chat.hasError)}`}>
            {t(`status.${chat.status}`)}
          </span>
          <div className="relative z-10 pointer-events-auto">
            <CardMenu
              items={[
                {
                  label: t("moveToProject"),
                  icon: FolderInput,
                  onClick: () => setShowMoveDialog(true),
                },
                {
                  label: t("deleteTranslation"),
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

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("deleteTranslation")}
        description={t("deleteTranslationWarning")}
        confirmLabel={t("delete")}
        loading={deleting}
        onConfirm={handleDelete}
      />

      <MoveToProjectDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        projects={projects}
        currentProjectId={chat.projectId}
        onSelect={(projectId) => onMove(chat.chatId, projectId)}
      />
    </>
  );
}
