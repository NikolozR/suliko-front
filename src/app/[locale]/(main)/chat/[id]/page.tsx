"use client";

import { useEffect, useState } from "react";
import {
  getChatById,
  getSingleChatHistoryOriginalFile,
} from "@/features/chatHistory";
import type { ChatDetailed } from "@/features/chatHistory";
import { settingUpChatSuggestions } from "@/features/chatHistory/utils/settingUpSuggestions";
import { useTranslations } from "next-intl";
import { Card } from "@/features/ui/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

import { useParams } from "next/navigation";
import { useChatEditingStore } from "@/features/chatHistory/store/chatEditingStore";
import { useChatSuggestionsStore } from "@/features/chatHistory/store/chatSuggestionsStore";
import ChatTranslationResultView from "@/features/chatHistory/components/ChatTranslationResultView";

export default function ChatPage() {
  const {
    translatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    setJobId,
    reset: resetChatEditingStore,
  } = useChatEditingStore();
  const { reset: resetChatSuggestionsStore, setHasGeneratedMore, setSuggestions } =
    useChatSuggestionsStore();
  const [chat, setChat] = useState<ChatDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [reconstructedFile, setReconstructedFile] = useState<File | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
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

  useEffect(() => {
    if (!chat || !chat.translationResult) return;

    resetChatEditingStore();
    resetChatSuggestionsStore();

    setTranslatedMarkdownWithoutZoomReset(
      chat.translationResult.translatedContent || ""
    );

    setJobId(chat.jobId || "");

    

    (async () => {
      try {
        const blobOrFile = await getSingleChatHistoryOriginalFile(chat.chatId);
        const isFile = typeof (blobOrFile as File).name === "string";
        const file = isFile
          ? (blobOrFile as File)
          : new File(
              [blobOrFile as Blob],
              chat.originalFileName || "original",
              { type: (blobOrFile as Blob).type || "application/octet-stream" }
            );
        setReconstructedFile(file);
        setHydrated(true);
        return;
      } catch {
        // ignore and fallback
      }

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
          const file = new (window.File || File)([blob], fileName, {
            type: contentType,
          });
          setReconstructedFile(file);
        } else {
          setReconstructedFile(null);
        }
      } catch {
        setReconstructedFile(null);
      }
      setHydrated(true);
    })();

    (async () => {
      try {
        setIsSuggestionsLoading(true);
        await settingUpChatSuggestions(chat.jobId);
        setHasGeneratedMore(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    })();
  }, [chat]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl mt-[40px]">
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
      <div className="container mx-auto p-6 max-w-[1600px] mt-[40px]">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-semibold">{chat.originalFileName}</h1>
        </div>
        <ChatTranslationResultView
          currentFile={reconstructedFile}
          translatedMarkdown={translatedMarkdown}
          onEdit={setTranslatedMarkdownWithoutZoomReset}
          isSuggestionsLoading={isSuggestionsLoading}
        />
      </div>
    );
  }

  // Fallback: show details card
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
