"use client";

import { useEffect, useState } from "react";
import { getChatHistory } from "@/features/chatHistory";
import type { Chat } from "@/features/chatHistory";
import { Card } from "@/features/ui/components/ui/card";
import { useTranslations } from "next-intl";
import { FileIcon, Clock } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("History");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getChatHistory();
        setChats(response.data.chats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <div className="grid gap-4">
        {chats.map((chat) => (
          <Link key={chat.chatId} href={`/document/${chat.chatId}`}>
            <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{chat.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(chat.lastActivityAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="uppercase text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {chat.fileType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    chat.status === "Completed" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : chat.hasError 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>
                    {chat.status}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 