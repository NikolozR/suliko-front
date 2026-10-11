"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useUserStore } from "@/features/auth/store/userStore";
import { NameGlossaryEditor } from "@/features/bulkTranslation/components/NameGlossaryEditor";
import type { NameTranslationItem } from "@/features/translation/types/types.Translation";
import { Button } from "@/features/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Textarea } from "@/features/ui/components/ui/textarea";
import { formatBalance } from "@/shared/utils/domainUtils";
import { startTranslation, type TranslationStart } from "../api";
import type { OrderTranslation } from "../types";

/** What suliko.ge itself accepts for the notes. */
const MAX_NOTES = 4000;

export type TranslateTarget = {
  slug: string;
  orderId: number;
  documentId: number;
  fileId: string;
  fileName: string;
};

type Refusal = Exclude<TranslationStart, { status: "started" }>;

/**
 * The translator's one click on a file the bureau sent, with room to tell
 * Suliko what the translation should follow: notes in their own words and
 * fixed spellings for names, the two things mass translation offers per
 * document. Both are optional.
 */
export function TranslateFileDialog({
  target,
  onClose,
  onStarted,
}: {
  /** The file to translate, or null while the dialog is closed. */
  target: TranslateTarget | null;
  onClose: () => void;
  onStarted: (documentId: number, translation: OrderTranslation) => void;
}) {
  const t = useTranslations("Orders");
  const tBulk = useTranslations("BulkTranslation");
  const userProfile = useUserStore((state) => state.userProfile);
  const [notes, setNotes] = useState("");
  const [names, setNames] = useState<NameTranslationItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);

  // A different file starts from a clean form: notes written for one document
  // are rarely right for the next. Closing and reopening the same file keeps
  // them, so a trip to top up the balance does not cost what was typed.
  const fileId = target?.fileId;
  const lastFileId = useRef<string | null>(null);
  useEffect(() => {
    if (!fileId) return;
    if (lastFileId.current !== null && lastFileId.current !== fileId) {
      setNotes("");
      setNames([]);
    }
    lastFileId.current = fileId;
    setRefusal(null);
  }, [fileId]);

  const start = async () => {
    if (!target || starting) return;
    setStarting(true);
    setRefusal(null);
    const result = await startTranslation(
      target.slug,
      target.orderId,
      target.documentId,
      target.fileId,
      { instructions: notes, names },
    );
    setStarting(false);
    if (result.status === "started") {
      setNotes("");
      setNames([]);
      onStarted(target.documentId, result.translation);
      // The pages have left the balance the sidebar shows.
      void useUserStore.getState().fetchUserProfile();
      onClose();
    } else {
      setRefusal(result);
    }
  };

  const onSubscription = userProfile?.subscription?.status === "Active";

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && !starting && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("translateTitle")}</DialogTitle>
          <DialogDescription>
            {t("translateIntro", { file: target?.fileName ?? "" })}
            {userProfile && !onSubscription && (
              <> {t("translateBalance", { balance: formatBalance(userProfile.balance || 0) })}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label htmlFor="translate-notes" className="text-sm font-medium">
            {tBulk("notesLabel")}
          </label>
          <Textarea
            id="translate-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={tBulk("notesPlaceholder")}
            maxLength={MAX_NOTES}
            rows={4}
            disabled={starting}
          />
          <p className="text-xs text-muted-foreground">{t("notesHint")}</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{tBulk("nameSpellings")}</p>
          <NameGlossaryEditor names={names} onChange={setNames} />
        </div>

        {refusal && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200/60 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {refusalText(refusal, t)}
              {refusal.status === "insufficientBalance" && (
                <>
                  {" "}
                  <Link href="/price" className="font-medium underline">
                    {t("translateTopUp")}
                  </Link>
                </>
              )}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={starting}>
            {t("translateCancel")}
          </Button>
          <Button type="button" onClick={start} disabled={starting}>
            {starting && <Loader2 className="h-4 w-4 animate-spin" />}
            {starting ? t("translateStarting") : t("translateStart")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function refusalText(refusal: Refusal, t: ReturnType<typeof useTranslations<"Orders">>): string {
  switch (refusal.status) {
    case "insufficientBalance":
      return refusal.pages !== null && refusal.balance !== null
        ? t("translateNotEnough", {
            pages: refusal.pages,
            balance: formatBalance(Number(refusal.balance) || 0),
          })
        : t("translateNotEnoughPlain");
    case "unsupportedFile":
      return t("translateUnsupported");
    case "tooLarge":
      return t("translateTooLarge");
    case "languageNotAvailable":
      return t("translateNoLanguage");
    case "alreadyTranslating":
      return t("translateBusy");
    case "signedOut":
      return t("signedOut");
    default:
      return t("translateError");
  }
}
