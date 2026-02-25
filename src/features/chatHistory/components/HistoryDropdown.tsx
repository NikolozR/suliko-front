"use client";

import { useEffect, useState } from "react";
import { getChatHistory } from "@/features/chatHistory";
import type { Chat } from "@/features/chatHistory";
import { FileIcon, Clock } from "lucide-react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

interface HistoryDropdownProps {
  isCollapsed: boolean;
  isOpen: boolean;
}

export function HistoryDropdown({ isCollapsed, isOpen }: HistoryDropdownProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("Projects");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await getChatHistory();
        response.data.chats.pop();
        setChats(response.data.chats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchHistory();
    }

    const handleProjectsUpdated = () => {
      if (isOpen) {
        fetchHistory();
      }
    };

    window.addEventListener("projects-updated", handleProjectsUpdated);
    return () => {
      window.removeEventListener("projects-updated", handleProjectsUpdated);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-3 text-xs text-destructive/80">
        {error}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="px-3 py-4 text-center">
        <FileIcon className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">{t("noProjects")}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "overflow-hidden transition-all duration-200",
      isCollapsed ? "w-0" : "w-full"
    )}>
      <div className="space-y-1 p-2">
        {chats.map((chat) => (
          <button
            key={chat.chatId}
            onClick={() => router.push(`/projects/${chat.chatId}`)}
            className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <div className="relative p-1 bg-primary/10 rounded">
                <FileIcon className="h-4 w-4 text-primary" />
                <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
                  chat.status === "Completed"
                    ? "bg-emerald-500"
                    : chat.hasError || chat.status === "Failed"
                      ? "bg-red-500"
                      : "bg-blue-500 animate-pulse"
                }`} />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{chat.originalFileName}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(chat.lastActivityAt).toLocaleDateString()}</span>
                    <span className="uppercase text-[10px] bg-primary/10 text-primary px-1 rounded">
                      {chat.fileType}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
        <Link
          href="/projects"
          className="block w-full text-left px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-primary"
        >
          {!isCollapsed && t("viewAll")}
        </Link>
      </div>
    </div>
  );
} 