"use client";

import { useEffect, useState } from "react";
import { getChatHistory } from "@/features/chatHistory";
import type { Chat } from "@/features/chatHistory";
import { FileIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

/** How many recent translations the sidebar lists; the rest are under "View all". */
const RECENT_COUNT = 3;

interface HistoryDropdownProps {
  isCollapsed: boolean;
  isOpen: boolean;
}

export function HistoryDropdown({ isCollapsed, isOpen }: HistoryDropdownProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Projects");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await getChatHistory({ pageSize: RECENT_COUNT });
        setChats(response.data.chats.slice(0, RECENT_COUNT));
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

    const handleTranslationsUpdated = () => {
      if (isOpen) {
        fetchHistory();
      }
    };

    window.addEventListener("translations-updated", handleTranslationsUpdated);
    return () => {
      window.removeEventListener("translations-updated", handleTranslationsUpdated);
    };
  }, [isOpen]);

  // Nothing fits in the collapsed rail, and its messages would be cut off.
  if (!isOpen || isCollapsed) return null;

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
        <p className="text-xs text-muted-foreground">{t("noTranslations")}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ul className="flex flex-col pl-6 pr-1 py-1">
        {chats.map((chat) => {
          const failed = chat.hasError || chat.status === "Failed";
          const done = chat.status === "Completed";
          return (
            <li key={chat.chatId}>
              <Link
                href={`/translations/${chat.chatId}`}
                title={chat.originalFileName}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <span
                  role="img"
                  aria-label={done ? t("statusDone") : failed ? t("statusFailed") : t("statusProcessing")}
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    done ? "bg-emerald-500" : failed ? "bg-red-500" : "bg-blue-500 animate-pulse"
                  )}
                />
                <span className="truncate">{chat.originalFileName}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/projects"
        className="block rounded-md py-1 pl-8 pr-2 text-[13px] font-medium text-primary hover:underline"
      >
        {t("viewAll")}
      </Link>
    </div>
  );
}
