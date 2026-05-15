"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Link } from "@/i18n/navigation";
import { Download, Loader2, ArrowLeft, CheckCircle2, ZoomIn, ZoomOut } from "lucide-react";
import { saveAs } from "file-saver";
import PassportUpload from "./PassportUpload";
import TemplateSelector from "./TemplateSelector";
import PassportFieldsForm from "./PassportFieldsForm";
import PassportPreview from "./PassportPreview";
import {
  extractPassportFields,
  generatePassportDocx,
} from "../services/passportService";
import type { PassportTemplate, ExtractedFields } from "../types/types.Passport";

type Step = "upload" | "review" | "complete";

const MSG_COUNT = 5;

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PassportPage() {
  const t = useTranslations("Passport");
  const { token } = useAuthStore();

  const PROCESSING_MESSAGES = [
    t("processingMsg0"),
    t("processingMsg1"),
    t("processingMsg2"),
    t("processingMsg3"),
    t("processingMsg4"),
  ];

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PassportTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<ExtractedFields>({});
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, number>>({});
  const [overallConfidence, setOverallConfidence] = useState<number>(0);
  const [judgeIterations, setJudgeIterations] = useState<number>(0);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [imgZoom, setImgZoom] = useState(1);

  // Progress bar
  const [progressValue, setProgressValue] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create/revoke object URL when file changes
  useEffect(() => {
    if (!file) { setFilePreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const startProgress = useCallback(() => {
    setProgressValue(0);
    setMsgIndex(0);
    setElapsedSec(0);

    // Slowly crawl toward 90% — never reaches 100 until finishProgress
    progressTimerRef.current = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 90) return prev;
        return Math.min(prev + Math.max(0.15, (90 - prev) * 0.012), 90);
      });
    }, 500);

    // Rotate message every 8 seconds
    msgTimerRef.current = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MSG_COUNT);
    }, 8000);

    // Elapsed counter
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
  }, []);

  const finishProgress = useCallback(() => {
    clearInterval(progressTimerRef.current!);
    clearInterval(msgTimerRef.current!);
    clearInterval(elapsedTimerRef.current!);
    setProgressValue(100);
  }, []);

  const resetProgress = useCallback(() => {
    clearInterval(progressTimerRef.current!);
    clearInterval(msgTimerRef.current!);
    clearInterval(elapsedTimerRef.current!);
    setProgressValue(0);
    setMsgIndex(0);
    setElapsedSec(0);
  }, []);

  const handleExtract = useCallback(async () => {
    if (!file || !selectedTemplate) return;

    setExtracting(true);
    setError("");
    startProgress();

    try {
      const fieldKeys = selectedTemplate.fields.map((f) => f.key);
      const result = await extractPassportFields(file, selectedTemplate.id, fieldKeys);

      finishProgress();

      if (result.success) {
        setFieldValues(result.extractedFields);
        setFieldConfidence(result.fieldConfidence ?? {});
        setOverallConfidence(result.overallConfidence ?? 0);
        setJudgeIterations(result.judgeIterations ?? 0);
        setStep("review");
        if (result.errorMessage) setError(result.errorMessage);
      } else {
        setError(result.errorMessage || t("errorExtraction"));
        resetProgress();
      }
    } catch (err) {
      resetProgress();
      if (err instanceof Error && err.message === "QUOTA_EXCEEDED") {
        setError(t("errorQuota"));
      } else {
        setError(err instanceof Error ? err.message : t("errorExtraction"));
      }
    }

    setExtracting(false);
  }, [file, selectedTemplate, t, startProgress, finishProgress, resetProgress]);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    setError("");

    try {
      const blob = await generatePassportDocx(
        selectedTemplate.id,
        selectedTemplate.docx_file_url,
        fieldValues
      );
      saveAs(blob, `passport-translation-${Date.now()}.docx`);
      setStep("complete");
    } catch (err) {
      if (err instanceof Error && err.message === "QUOTA_EXCEEDED") {
        setError(t("errorQuota"));
      } else {
        setError(err instanceof Error ? err.message : t("errorGeneration"));
      }
    }

    setGenerating(false);
  }, [selectedTemplate, fieldValues, t]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRestart = useCallback(() => {
    setStep("upload");
    setFile(null);
    setSelectedTemplate(null);
    setFieldValues({});
    setFieldConfidence({});
    setOverallConfidence(0);
    setJudgeIterations(0);
    setError("");
    resetProgress();
  }, [resetProgress]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-3">{t("title")}</h1>
        <p className="text-muted-foreground mb-6 max-w-md">{t("description")}</p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg suliko-default-bg text-primary-foreground font-semibold dark:text-white"
        >
          {t("signInRequired")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* ── Progress bar (visible while extracting) ────────────────────── */}
      {extracting && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin shrink-0" />
              <span className="transition-opacity duration-500">{PROCESSING_MESSAGES[msgIndex]}</span>
            </span>
            <span className="tabular-nums">{formatElapsed(elapsedSec)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full suliko-default-bg transition-all duration-500 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Upload step ───────────────────────────────────────────────── */}
      {step === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PassportUpload file={file} onFileSelect={setFile} disabled={extracting} />
          </div>
          <div className="space-y-6">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelect={setSelectedTemplate}
              disabled={extracting}
            />
          </div>
          <div className="lg:col-span-2">
            <button
              onClick={handleExtract}
              disabled={!file || !selectedTemplate || extracting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg suliko-default-bg text-primary-foreground font-semibold dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("extracting")}
                </>
              ) : (
                t("extractAndReview")
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Review step ───────────────────────────────────────────────── */}
      {step === "review" && selectedTemplate && (
        <div>
          <button
            onClick={() => setStep("upload")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToUpload")}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Col 1: editable fields */}
            <div className="lg:col-span-1">
              <PassportFieldsForm
                fields={selectedTemplate.fields}
                values={fieldValues}
                confidence={fieldConfidence}
                overallConfidence={overallConfidence}
                judgeIterations={judgeIterations}
                onChange={handleFieldChange}
                onReExtract={handleExtract}
                disabled={generating}
                extracting={extracting}
              />

              <div className="mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-lg suliko-default-bg text-primary-foreground font-semibold dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("generating")}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {t("generate")}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Col 2: sticky panel — stays in view while user scrolls fields */}
            <div className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start">
              <div className="space-y-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40">
              {/* Original uploaded document */}
              <div className="rounded-xl border bg-muted/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-background/60">
                  <span className="text-xs font-medium text-muted-foreground">{t("originalDocument")}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setImgZoom((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title="Zoom out"
                    >
                      <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <span className="text-[10px] text-muted-foreground w-8 text-center">
                      {Math.round(imgZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setImgZoom((z) => Math.min(3, z + 0.25))}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="overflow-auto max-h-[340px] p-2">
                  {filePreviewUrl && file?.type === "application/pdf" ? (
                    <iframe
                      src={filePreviewUrl}
                      className="w-full rounded"
                      style={{ height: 300 }}
                      title="Passport document"
                    />
                  ) : filePreviewUrl ? (
                    <img
                      src={filePreviewUrl}
                      alt="Uploaded passport"
                      className="w-full rounded object-contain origin-top-left transition-transform"
                      style={{ transform: `scale(${imgZoom})`, transformOrigin: "top left" }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                      {t("noPreview")}
                    </div>
                  )}
                </div>
              </div>

              {/* Live DOCX preview */}
              <PassportPreview
                templateId={selectedTemplate.id}
                docxUrl={selectedTemplate.docx_file_url}
                fields={fieldValues}
              />
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete step ─────────────────────────────────────────────── */}
      {step === "complete" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("success")}</h2>
          <p className="text-muted-foreground mb-6 text-sm">{t("successDescription")}</p>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border hover:bg-accent transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              {t("downloadAgain")}
            </button>
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg suliko-default-bg text-primary-foreground font-semibold dark:text-white text-sm"
            >
              {t("translateAnother")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
