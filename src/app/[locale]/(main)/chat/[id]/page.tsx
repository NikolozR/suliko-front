"use client";

import { useEffect, useState } from "react";
import { getChatById } from "@/features/chatHistory";
import type { Chat } from "@/features/chatHistory";
import { useTranslations } from "next-intl";
import { Card } from "@/features/ui/components/ui/card";
import { FileIcon, Clock, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

import { useParams } from "next/navigation";

export default function ChatPage() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Chat");
  const router = useRouter();
  const params = useParams();

  // params.id may be string or string[] depending on catch-all, so handle both
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        const response = await getChatById(chatId as string);
        setChat(response.data.chats[0]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchChat();
    }
  }, [chatId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-muted-foreground">{t("notFound")}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-semibold">{t("details")}</h1>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-medium mb-2">{chat.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(chat.lastActivityAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="uppercase text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {chat.fileType}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    chat.status === "Completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : chat.hasError
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {chat.status}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">
                  {t("originalFile")}
                </span>
                <p>{chat.originalFileName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  {t("targetLanguage")}
                </span>
                <p>{chat.targetLanguageName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  {t("created")}
                </span>
                <p>{new Date(chat.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {chat.hasResult && (
              <div className="mt-6">
                <Button className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>{t("downloadResult")}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
