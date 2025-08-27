"use client";

import { useEffect, useState } from "react";
import { getChatById } from "@/features/chatHistory";
import type { ChatDetailed } from "@/features/chatHistory";
import { useTranslations } from "next-intl";
import { Card } from "@/features/ui/components/ui/card";
import { FileIcon, Clock, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

import { useParams } from "next/navigation";
import { useChatEditingStore } from "@/features/chatHistory/store/chatEditingStore";
import { useChatSuggestionsStore } from "@/features/chatHistory/store/chatSuggestionsStore";
import ChatTranslationResultView from "@/features/chatHistory/components/ChatTranslationResultView";

export default function ChatPage() {
  const { translatedMarkdown, setTranslatedMarkdownWithoutZoomReset } = useChatEditingStore();
  const [chat, setChat] = useState<ChatDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [reconstructedFile, setReconstructedFile] = useState<File | null>(null);
  const t = useTranslations("Chat");
  const router = useRouter();
  const params = useParams();

  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        const response = await getChatById(chatId as string);
        setChat(response.data);
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

  // Hydrate chat editing + suggestions stores when chat data arrives
  useEffect(() => {
    if (!chat || !chat.translationResult) return;

    // Reset stores to avoid cross-chat bleed
    useChatEditingStore.getState().reset();
    useChatSuggestionsStore.getState().reset();

    // Set translated content and identifiers
    useChatEditingStore.getState().setTranslatedMarkdownWithoutZoomReset(
      chat.translationResult.translatedContent || ''
    );
    useChatEditingStore.getState().setJobId(
      chat.translationResult.translationId || ''
    );

    // Set suggestions from history
    if (Array.isArray(chat.translationResult.suggestions)) {
      useChatSuggestionsStore.getState().setSuggestions(
        chat.translationResult.suggestions
      );
      // prevent generate more for now
      useChatSuggestionsStore.getState().setHasGeneratedMore(true);
    }

    // Reconstruct original file for preview if we have data
    try {
      const { fileData, fileName, contentType } = chat.translationResult;
      if (fileData && fileName && contentType) {
        const byteString = atob(fileData);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: contentType });
        const file = new (window.File || File)([blob], fileName, { type: contentType });
        setReconstructedFile(file);
      } else {
        setReconstructedFile(null);
      }
    } catch {
      setReconstructedFile(null);
    }

    setHydrated(true);
  }, [chat]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl mt-[150px]">
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

  if (chat && hydrated && reconstructedFile) {
    return (
      <div className="container mx-auto p-6 max-w-[1600px] mt-[150px]">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-semibold">{chat.title}</h1>
        </div>
        <ChatTranslationResultView
          currentFile={reconstructedFile}
          translatedMarkdown={translatedMarkdown}
          onEdit={setTranslatedMarkdownWithoutZoomReset}
          isSuggestionsLoading={false}
        />
      </div>
    );
  }

  // Fallback: show details card
  return (
    <div className="container mx-auto p-6 max-w-4xl mt-[150px]">
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
            {chat && (
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
