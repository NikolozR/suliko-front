"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, ClipboardList, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "@/i18n/navigation";
import { Button } from "@/features/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { uploadTranslation } from "../api";
import {
  noteSentToOrder,
  orderOfTranslation,
  type OrderTranslationNote,
} from "../orderTranslations";

export type OrderExportFormat = "docx" | "pdf" | "srt";

type Problem = "tooLarge" | "gone" | "signedOut" | "error";

const PROBLEM_KEYS: Record<Problem, string> = {
  tooLarge: "sendTooLarge",
  gone: "sendGone",
  signedOut: "sendSignedOut",
  error: "sendError",
};

/**
 * On a translation's result, when it was made from a bureau's file: says which
 * order it is for and sends the translation there, as it stands in the editor.
 *
 * Renders nothing for an ordinary translation.
 */
export function SendToOrder({
  chatId,
  build,
}: {
  chatId: string;
  /**
   * The translation as it stands now, as one file of that kind, named after
   * `sourceName` (the bureau's file).
   */
  build: (format: OrderExportFormat, sourceName: string) => Promise<File>;
}) {
  const t = useTranslations("Orders");
  // Read after mount: the note is in this browser, which the server does not see.
  const [note, setNote] = useState<OrderTranslationNote | null>(null);
  useEffect(() => {
    setNote(orderOfTranslation(chatId));
  }, [chatId]);

  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<OrderExportFormat>("docx");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  if (!note) return null;

  // Subtitles go back as subtitles; anything else as a document.
  const formats: OrderExportFormat[] = /\.srt$/i.test(note.fileName) ? ["srt"] : ["docx", "pdf"];
  const chosen = formats.includes(format) ? format : formats[0];

  const send = async () => {
    setSending(true);
    setProblem(null);
    try {
      const file = await build(chosen, note.fileName);
      const sent = await uploadTranslation(note.slug, note.orderId, note.documentId, file);
      if (sent.status !== "ok") {
        setProblem(sent.status);
        return;
      }
      setNote(noteSentToOrder(chatId, sent.file.name) ?? note);
      setOpen(false);
      toast.success(t("sendDone"));
    } catch {
      // The file could not be made (the PDF or Word export failed).
      setProblem("error");
    } finally {
      setSending(false);
    }
  };

  const orderHref = `/orders/${note.slug}/${note.orderId}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-suliko-default-color/30 bg-suliko-default-color/[0.04] p-4">
        <ClipboardList className="h-5 w-5 shrink-0 text-suliko-default-color" aria-hidden />
        <div className="min-w-0 flex-1 basis-56 text-sm">
          <Link href={orderHref} className="font-medium text-foreground hover:underline">
            {t("forOrder", { number: note.orderNumber ?? "", bureau: note.organization })}
            {note.documentName ? ` · ${note.documentName}` : ""}
          </Link>
          <p className="mt-0.5 text-muted-foreground">
            {note.sent ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
                <span className="break-all">{t("sentAs", { name: note.sent.name })}</span>
              </span>
            ) : (
              t("sendHint")
            )}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={note.sent ? "outline" : "default"}
          onClick={() => {
            setProblem(null);
            setOpen(true);
          }}
          className="shrink-0"
        >
          <Send className="mr-1.5 h-4 w-4" aria-hidden />
          {note.sent ? t("sendAgain") : t("send")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(next) => !sending && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sendTitle", { number: note.orderNumber ?? "" })}</DialogTitle>
            <DialogDescription>{t("sendIntro", { bureau: note.organization })}</DialogDescription>
          </DialogHeader>

          {formats.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-medium">{t("sendFormat")}</p>
              <div role="radiogroup" aria-label={t("sendFormat")} className="flex flex-wrap gap-2">
                {formats.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={chosen === option}
                    disabled={sending}
                    onClick={() => setFormat(option)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-suliko-default-color/50",
                      chosen === option
                        ? "border-suliko-default-color bg-suliko-default-color/[0.06] font-medium text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    {t(option === "docx" ? "formatDocx" : option === "pdf" ? "formatPdf" : "formatSrt")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {problem && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200/60 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{t(PROBLEM_KEYS[problem])}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={sending} onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" disabled={sending} onClick={send}>
              {sending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="mr-1.5 h-4 w-4" aria-hidden />
              )}
              {sending ? t("sending") : t("send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
