"use client";

import { useEffect, useState } from "react";
import { getChatHistory } from "@/features/chatHistory";
import type { Chat } from "@/features/chatHistory";
import { Card } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { useTranslations, useLocale } from "next-intl";
import { FileText, Image, FileSpreadsheet, FileIcon, Clock, Plus, ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

const FILE_TYPE_CONFIG: Record<string, { icon: typeof FileIcon; color: string; bg: string }> = {
  pdf: { icon: FileText, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40" },
  docx: { icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  doc: { icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  txt: { icon: FileText, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/40" },
  xlsx: { icon: FileSpreadsheet, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40" },
  xls: { icon: FileSpreadsheet, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40" },
  png: { icon: Image, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  jpg: { icon: Image, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  jpeg: { icon: Image, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
};

function getFileConfig(fileType: string) {
  return FILE_TYPE_CONFIG[fileType?.toLowerCase()] ?? { icon: FileIcon, color: "text-muted-foreground", bg: "bg-muted" };
}

function getStatusStyle(status: string, hasError: boolean) {
  if (status === "Completed") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40";
  if (hasError || status === "Failed") return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200/60 dark:border-red-800/40";
  return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40";
}

export default function ProjectsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Projects");
  const locale = useLocale();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getChatHistory();
        setChats(response.data.chats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">{t("title")}</h1>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-muted/50 mb-6">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4 max-w-sm">{t("noProjects")}</p>
          <Link
            href="/document"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {t("title")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => {
            const config = getFileConfig(chat.fileType);
            const Icon = config.icon;
            return (
              <Link key={chat.chatId} href={`/projects/${chat.chatId}`}>
                <Card className="p-4 border border-border/60 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
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
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
