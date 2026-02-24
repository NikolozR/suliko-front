"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
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

const PROGRESS_KEYS = [
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
] as const;

const TIP_KEYS = ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"] as const;

const STAGE_LABELS_EN = ["Uploading", "Queued", "Analyzing", "Translating", "Finalizing"];

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
  const [tipIndex, setTipIndex] = useState(0);
  const [liveStatus, setLiveStatus] = useState<string>("");
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const t = useTranslations("Project");
  const tProgress = useTranslations("DocumentTranslationCard.progress");
  const tOverlay = useTranslations("TranslationLoadingOverlay");
  const router = useRouter();
  const params = useParams();

  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const chatRef = useRef<ChatDetailed | null>(null);
  chatRef.current = chat;
  const mountTimeRef = useRef(Date.now());
  const pollCancelledRef = useRef(false);
  const isTerminalRef = useRef(false);

  // Reset stores when switching projects
  useEffect(() => {
    if (!projectId) return;
    setChat(null);
    setReconstructedFile(null);
    setElapsedSeconds(0);
    setHydrated(false);
    setLiveStatus("");
    setSimulatedProgress(0);
    setTipIndex(0);
    mountTimeRef.current = Date.now();
    pollCancelledRef.current = false;
    isTerminalRef.current = false;
    resetChatEditingStore();
    resetChatSuggestionsStore();
  }, [projectId, resetChatEditingStore, resetChatSuggestionsStore]);

  // Fetch chat with retry (backend may not have the record ready yet)
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    let retries = 0;

    const fetchWithRetry = async () => {
      while (!cancelled && retries < 10) {
        try {
          const response = await getChatById(projectId);
          if (cancelled) return;
          const data = response.data;
          setChat(data);
          chatRef.current = data;
          setError(null);
          setLiveStatus(data.status);

          const createdAt = new Date(data.createdAt).getTime();
          if (Number.isFinite(createdAt)) {
            mountTimeRef.current = createdAt;
            const initialElapsed = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
            setElapsedSeconds(initialElapsed);
          }
          setLoading(false);
          return;
        } catch (err) {
          retries++;
          if (retries >= 10) {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : "Failed to load project");
              setLoading(false);
            }
            return;
          }
          await new Promise((r) => setTimeout(r, Math.min(retries * 1000, 3000)));
        }
      }
    };

    fetchWithRetry();
    return () => { cancelled = true; };
  }, [projectId]);

  // Timer: increments every second, initial value set from createdAt in fetch
  useEffect(() => {
    if (!projectId) return;
    const id = setInterval(() => {
      if (isTerminalRef.current) return;
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [projectId]);

  // Tip rotation: every 10s
  useEffect(() => {
    if (!projectId) return;
    const id = setInterval(() => {
      if (isTerminalRef.current) return;
      setTipIndex((prev) => (prev + 1) % TIP_KEYS.length);
    }, 10000);
    return () => clearInterval(id);
  }, [projectId]);

  // Simulated progress bar: smoothly climbs, decoupled from backend
  useEffect(() => {
    if (!projectId) return;
    const id = setInterval(() => {
      if (isTerminalRef.current) return;
      setSimulatedProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = prev < 30 ? 0.8 : prev < 60 ? 0.4 : prev < 80 ? 0.2 : 0.05;
        return Math.min(95, prev + increment);
      });
    }, 500);
    return () => clearInterval(id);
  }, [projectId]);

  // Completion handler
  const handleCompleted = useCallback(async (jobId: string, chatId: string) => {
    isTerminalRef.current = true;
    setSimulatedProgress(100);
    setLiveStatus("Completed");
    await fetchUserProfileWithRetry(3, 1000);
    try {
      const resultBlob = (await getResult(jobId)) as Blob;
      const text = await resultBlob.text();
      setTranslatedMarkdownWithoutZoomReset(text);
      setJobId(jobId);
      setChatId(chatId);
    } catch {
      try {
        const res = await getChatById(chatId);
        if (res.data.translationResult?.translatedContent) {
          setTranslatedMarkdownWithoutZoomReset(res.data.translationResult.translatedContent);
        }
      } catch { /* ignore */ }
    }
    setChat((prev) => (prev ? { ...prev, status: "Completed" } : null));
  }, [fetchUserProfileWithRetry, setChatId, setJobId, setTranslatedMarkdownWithoutZoomReset]);

  // Polling: uses refs to avoid dependency loops
  useEffect(() => {
    if (!projectId) return;
    pollCancelledRef.current = false;

    const poll = async () => {
      if (pollCancelledRef.current) return;
      const currentChat = chatRef.current;

      if (!currentChat?.jobId) {
        if (!pollCancelledRef.current) setTimeout(poll, 2000);
        return;
      }

      if (currentChat.status === "Completed" || currentChat.status === "Failed") return;

      try {
        const statusResult = await getStatus(currentChat.jobId);
        if (pollCancelledRef.current) return;

        if (statusResult.status === "Completed") {
          await handleCompleted(currentChat.jobId, currentChat.chatId);
          return;
        }

        if (statusResult.status === "Failed") {
          isTerminalRef.current = true;
          setChat((prev) => prev ? { ...prev, status: "Failed" } : null);
          setLiveStatus("Failed");
          setError(statusResult.message || "Translation failed. Please try again.");
          return;
        }

        setLiveStatus(statusResult.status);
        if (!pollCancelledRef.current) setTimeout(poll, 3000);
      } catch {
        if (!pollCancelledRef.current) setTimeout(poll, 5000);
      }
    };

    const initialDelay = setTimeout(poll, 1000);
    return () => {
      pollCancelledRef.current = true;
      clearTimeout(initialDelay);
    };
  }, [projectId, handleCompleted]);

  // Hydrate when we have translation result
  useEffect(() => {
    if (!chat || chat.chatId !== projectId) return;
    const hasContent = translatedMarkdown || chat.translationResult?.translatedContent;
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
      } catch { /* ignore */ }

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
          const file = new (window.File || File)([blob], fileName, { type: contentType });
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
    projectId, chat, translatedMarkdown,
    resetChatEditingStore, resetChatSuggestionsStore,
    setChatId, setHasGeneratedMore, setJobId, setSuggestions,
    setTranslatedMarkdownWithoutZoomReset,
  ]);

  // --- Derived state for rendering ---
  const SECONDS_PER_MESSAGE = 15;
  const progressIdx = elapsedSeconds >= 240
    ? PROGRESS_KEYS.length - 1
    : Math.floor(elapsedSeconds / SECONDS_PER_MESSAGE);
  const msgKey = PROGRESS_KEYS[Math.min(progressIdx, PROGRESS_KEYS.length - 1)];

  const pageCountNum = chat?.pageCount ?? 0;
  const wordCountForMsg = chat?.estimatedWordCount ??
    (chat?.fileSizeKB ? Math.round(chat.fileSizeKB * 280) : pageCountNum * 483);
  const estMin = chat?.estimatedTimeMinutes ?? (pageCountNum > 0 ? pageCountNum * 2 : 0);
  const estCost = pageCountNum > 0 ? (pageCountNum * 0.1).toFixed(2) : "0.00";
  const ext = chat?.originalFileName?.split(".").pop()?.toLowerCase() || chat?.fileType || "docx";

  const getProgressMsg = () => {
    if (msgKey === "documentInfo")
      return tProgress("documentInfo", { data: pageCountNum }).replace(" pages", pageCountNum === 1 ? " page" : " pages");
    if (msgKey === "wordCount") return tProgress("wordCount", { data: wordCountForMsg });
    if (msgKey === "estimatedTime") return tProgress("estimatedTime", { data: estMin });
    if (msgKey === "estimatedCost") return tProgress("estimatedCost", { data: estCost });
    if (msgKey === "documentType") return tProgress("documentType", { data: ext });
    if (msgKey === "thankYou" && elapsedSeconds >= 240) return tProgress("longerThanUsual");
    return tProgress(msgKey);
  };

  const currentStageIndex = simulatedProgress < 10 ? 0
    : simulatedProgress < 25 ? 1
    : simulatedProgress < 50 ? 2
    : simulatedProgress < 85 ? 3
    : 4;

  const stageLabels = [
    tOverlay("stageUpload"),
    tOverlay("stageQueue"),
    tOverlay("stageAnalyze"),
    tOverlay("stageTranslate"),
    tOverlay("stageFinalize"),
  ];

  // --- RENDER ---

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

  if (error && liveStatus === "Failed" && chat) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-semibold">{chat.originalFileName}</h1>
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
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full mb-4">
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
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full mb-4">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="text-muted-foreground">{t("notFound")}</div>
      </div>
    );
  }

  // Completed + hydrated — show result
  if (chat.chatId === projectId && hydrated && reconstructedFile) {
    return (
      <div className="container mx-auto p-6 max-w-[1600px]">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
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

  // --- IN PROGRESS: the main waiting experience ---
  const info = t.raw("processingInfo") as Record<string, string>;
  const tips = t.raw("processingTips") as Record<string, string>;
  const currentTip = tips?.[TIP_KEYS[tipIndex]] || tips?.tip1;
  const progressMsg = getProgressMsg();
  const pageCount = chat.pageCount;
  const wordCount = chat.estimatedWordCount ?? (chat.fileSizeKB ? Math.round(chat.fileSizeKB * 280) : null);
  const estMinutes = chat.estimatedTimeMinutes;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-semibold truncate">{chat.originalFileName}</h1>
      </div>

      <div className="space-y-5">
        {/* Status + timer + progress bar */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
            <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
              {t(`status.${getDisplayStatus(liveStatus || chat.status)}`)}
            </span>
            <span className="text-sm text-muted-foreground shrink-0">
              {t("elapsed")}: <span className="font-mono font-medium tabular-nums">{formatElapsed(elapsedSeconds)}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{progressMsg}</span>
              <span>{Math.round(simulatedProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${simulatedProgress}%` }}
              />
            </div>
          </div>

          {/* Stage chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {stageLabels.map((label, index) => {
              const isDone = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              return (
                <span
                  key={STAGE_LABELS_EN[index]}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-300 inline-flex items-center gap-1 ${
                    isDone
                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:border-green-800/40 dark:text-green-400"
                      : isCurrent
                        ? "bg-primary/10 border-primary/30 text-primary font-medium animate-pulse"
                        : "bg-muted/50 border-border text-muted-foreground"
                  }`}
                >
                  {isDone && <CheckCircle2 className="h-3 w-3" />}
                  {isCurrent && <Loader2 className="h-3 w-3 animate-spin" />}
                  {label}
                </span>
              );
            })}
          </div>
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
          </div>
        </Card>

        {/* Did you know? — auto-rotating */}
        <Card className="p-5 border-dashed">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary text-lg">💡</span> {tips?.title ?? "Did you know?"}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed transition-opacity duration-500">
            {currentTip}
          </p>
        </Card>

        {/* Reassurance */}
        <p className="text-sm text-muted-foreground text-center">
          {info?.leaveAndReturn ?? t("processing")}
        </p>
      </div>
    </div>
  );
}
