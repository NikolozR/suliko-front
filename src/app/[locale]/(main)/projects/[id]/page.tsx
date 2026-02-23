"use client";

import { useEffect, useState } from "react";
import {
  getChatById,
  getSingleChatHistoryOriginalFile,
} from "@/features/chatHistory";
import type { ChatDetailed } from "@/features/chatHistory";
import { settingUpChatSuggestions } from "@/features/chatHistory/utils/settingUpSuggestions";
import { getStatus, getResult } from "@/features/translation/services/jobService";
import { useUserStore } from "@/features/auth/store/userStore";
import { useTranslations } from "next-intl";
import { Card } from "@/features/ui/components/ui/card";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

import { useParams } from "next/navigation";
import { useChatEditingStore } from "@/features/chatHistory/store/chatEditingStore";
import { useChatSuggestionsStore } from "@/features/chatHistory/store/chatSuggestionsStore";
import ChatTranslationResultView from "@/features/chatHistory/components/ChatTranslationResultView";

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getDisplayStatus(status: string): string {
  const map: Record<string, string> = {
    Completed: "Completed",
    InProgress: "Processing",
    Failed: "Failed",
    Queued: "Queued",
    Processing: "Processing",
  };
  return map[status] ?? status;
}

export default function ProjectDetailPage() {
  const {
    translatedMarkdown,
    setTranslatedMarkdownWithoutZoomReset,
    setJobId,
    setChatId,
    reset: resetChatEditingStore,
  } = useChatEditingStore();
  const { reset: resetChatSuggestionsStore, setHasGeneratedMore, setSuggestions } =
    useChatSuggestionsStore();
  const { fetchUserProfileWithRetry } = useUserStore();
  const [chat, setChat] = useState<ChatDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [reconstructedFile, setReconstructedFile] = useState<File | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const t = useTranslations("Project");
  const tProgress = useTranslations("DocumentTranslationCard.progress");
  const router = useRouter();
  const params = useParams();

  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Reset stores and clear chat when switching projects - prevents showing stale content from a different project
  useEffect(() => {
    if (!projectId) return;
    setChat(null);
    setReconstructedFile(null);
    setElapsedSeconds(0);
    resetChatEditingStore();
    resetChatSuggestionsStore();
    setHydrated(false);
  }, [projectId, resetChatEditingStore, resetChatSuggestionsStore]);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        const response = await getChatById(projectId as string);
        const data = response.data;
        setChat(data);
        setError(null);
        const createdAt = new Date(data.createdAt).getTime();
        if (Number.isFinite(createdAt)) {
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - createdAt) / 1000)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchChat();
    }
  }, [projectId]);

  // Poll job status when in progress, fetch result when completed
  useEffect(() => {
    if (!chat?.jobId || chat.status === "Completed" || chat.status === "Failed") return;

    let cancelled = false;

    const poll = async () => {
      try {
        const statusResult = await getStatus(chat.jobId);
        if (cancelled) return;

        if (statusResult.status === "Completed") {
          await fetchUserProfileWithRetry(3, 1000);
          try {
            const resultBlob = (await getResult(chat.jobId)) as Blob;
            const text = await resultBlob.text();
            setTranslatedMarkdownWithoutZoomReset(text);
            setJobId(chat.jobId);
            setChatId(chat.chatId);
          } catch {
            // Refetch chat - backend might have translationResult
            const res = await getChatById(chat.chatId);
            if (res.data.translationResult?.translatedContent) {
              setTranslatedMarkdownWithoutZoomReset(
                res.data.translationResult.translatedContent
              );
            }
          }
          setChat((prev) => (prev ? { ...prev, status: "Completed" } : null));
          return;
        }

        if (statusResult.status === "Failed") {
          setChat((prev) =>
            prev ? { ...prev, status: "Failed" } : null
          );
          setError(
            statusResult.message || "Translation failed. Please try again."
          );
          return;
        }

        // Still in progress, poll again
        setTimeout(poll, 3000);
      } catch (err) {
        if (!cancelled) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [
    chat?.jobId,
    chat?.chatId,
    chat?.status,
    setTranslatedMarkdownWithoutZoomReset,
    setJobId,
    setChatId,
    fetchUserProfileWithRetry,
  ]);

  // Hydrate when we have translation result (from API or from getResult)
  useEffect(() => {
    if (!chat || chat.chatId !== projectId) return;

    const hasContent =
      translatedMarkdown ||
      chat.translationResult?.translatedContent;

    if (!hasContent) return;

    const content = translatedMarkdown || chat.translationResult?.translatedContent || "";
    resetChatEditingStore();
    resetChatSuggestionsStore();
    setTranslatedMarkdownWithoutZoomReset(content);
    setJobId(chat.jobId || "");
    setChatId(chat.chatId || "");

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
        // ignore
      }

      try {
        const { fileData, fileName, contentType } = chat.translationResult || {};
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
  }, [
    projectId,
    chat,
    translatedMarkdown,
    resetChatEditingStore,
    resetChatSuggestionsStore,
    setChatId,
    setHasGeneratedMore,
    setJobId,
    setSuggestions,
    setTranslatedMarkdownWithoutZoomReset,
  ]);

  // Elapsed time counter — compute from chat.createdAt every second when in progress
  useEffect(() => {
    if (!chat || (chat.status !== "InProgress" && chat.status !== "Queued")) return;
    const createdAt = new Date(chat.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return;

    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
      setElapsedSeconds(elapsed);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [chat?.chatId, chat?.status, chat?.createdAt]);

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

  if (error && chat?.status === "Failed" && chat?.chatId === projectId) {
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
          <h1 className="text-2xl font-semibold">{chat?.originalFileName}</h1>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            <span className="px-2 py-1 rounded text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {t("status.Failed")}
            </span>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full mb-4"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full mb-4"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="text-muted-foreground">{t("notFound")}</div>
      </div>
    );
  }

  // In progress or queued - show status and elapsed time
  const isInProgress =
    chat.chatId === projectId &&
    chat.status !== "Completed" &&
    chat.status !== "Failed";

  if (isInProgress && !hydrated) {
    const info = t.raw("processingInfo") as Record<string, string>;
    const tips = t.raw("processingTips") as Record<string, string>;
    const tipKeys = ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"];
    const currentTipIndex = Math.floor(elapsedSeconds / 12) % tipKeys.length;
    const currentTip = tips?.[tipKeys[currentTipIndex]] || tips?.tip1;

    // Progress phrases (same order as old loading bar) — cycle every 15s over ~4 min
    const progressKeys = [
      "starting",
      "documentType",
      "documentInfo",
      "wordCount",
      "estimatedTime",
      "estimatedCost",
      "preparing",
      "analyzing",
      "translating",
      "firstPageDone",
      "checkingMistakes",
      "stillChecking",
      "enhancing",
      "finalizing",
      "waiting",
      "thankYou",
    ];
    const SECONDS_PER_MESSAGE = 15;
    const idx = elapsedSeconds >= 240 ? progressKeys.length - 1 : Math.floor(elapsedSeconds / SECONDS_PER_MESSAGE);
    const msgKey = progressKeys[Math.min(idx, progressKeys.length - 1)];
    const pageCountNum = chat.pageCount ?? 0;
    const wordCountForMsg =
      chat.estimatedWordCount ??
      (chat.fileSizeKB ? Math.round(chat.fileSizeKB * 280) : pageCountNum * 483);
    const estMin =
      chat.estimatedTimeMinutes ?? (pageCountNum > 0 ? pageCountNum * 2 : 0);
    const estCost =
      pageCountNum > 0 ? (pageCountNum * 0.1).toFixed(2) : "0.00";
    const ext = chat.originalFileName?.split(".").pop()?.toLowerCase() || chat.fileType || "docx";
    const progressMsg =
      msgKey === "documentInfo"
        ? tProgress("documentInfo", { data: pageCountNum }).replace(
            " pages",
            pageCountNum === 1 ? " page" : " pages"
          )
        : msgKey === "wordCount"
          ? tProgress("wordCount", { data: wordCountForMsg })
          : msgKey === "estimatedTime"
            ? tProgress("estimatedTime", { data: estMin })
            : msgKey === "estimatedCost"
              ? tProgress("estimatedCost", { data: estCost })
              : msgKey === "documentType"
                ? tProgress("documentType", { data: ext })
                : msgKey === "thankYou" && elapsedSeconds >= 240
                  ? tProgress("longerThanUsual")
                  : tProgress(msgKey);

    const pageCount = chat.pageCount;
    const wordCount =
      chat.estimatedWordCount ??
      (chat.fileSizeKB ? Math.round(chat.fileSizeKB * 280) : null);
    const estMinutes = chat.estimatedTimeMinutes;

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
          <h1 className="text-2xl font-semibold truncate">{chat.originalFileName}</h1>
        </div>

        <div className="space-y-6">
          {/* Status bar */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
              <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                {t(`status.${getDisplayStatus(chat.status)}`)}
              </span>
              <span className="text-sm text-muted-foreground shrink-0">
                {t("elapsed")}: <span className="font-mono font-medium">{formatElapsed(elapsedSeconds)}</span>
              </span>
            </div>
            <p className="text-sm text-foreground/90 font-medium transition-opacity duration-300">
              {progressMsg}
            </p>
          </Card>

          {/* Translation info */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">{info?.title ?? "Translation in progress"}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{info?.fileType ?? "File type"}</p>
                <p className="font-medium text-sm uppercase">{chat.fileType || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{info?.sourceLanguage ?? "Source"}</p>
                <p className="font-medium text-sm">{chat.sourceLanguageName || "Auto"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{info?.targetLanguage ?? "Target"}</p>
                <p className="font-medium text-sm">{chat.targetLanguageName || "—"}</p>
              </div>
              {(pageCount != null || wordCount != null || estMinutes != null) && (
                <>
                  {pageCount != null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{info?.pages ?? "Pages"}</p>
                      <p className="font-medium text-sm">{pageCount}</p>
                    </div>
                  )}
                  {wordCount != null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{info?.approxWords ?? "Approx. words"}</p>
                      <p className="font-medium text-sm">~{wordCount.toLocaleString()}</p>
                    </div>
                  )}
                  {estMinutes != null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{info?.estimatedTime ?? "Est. time"}</p>
                      <p className="font-medium text-sm">~{estMinutes} min</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Did you know? */}
          <Card className="p-6 border-dashed">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary">💡</span> {tips?.title ?? "Did you know?"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{currentTip}</p>
          </Card>

          {/* Reassurance */}
          <p className="text-sm text-muted-foreground text-center">
            {info?.leaveAndReturn ?? t("processing")}
          </p>
        </div>
      </div>
    );
  }

  if (chat && chat.chatId === projectId && hydrated && reconstructedFile) {
    return (
      <div className="container mx-auto p-6 max-w-[1600px]">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-semibold">{chat.originalFileName}</h1>
            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {t("status.Completed")}
            </span>
          </div>
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
