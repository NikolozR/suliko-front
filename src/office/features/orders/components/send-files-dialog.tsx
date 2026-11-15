"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { AlertTriangle, Loader2, Mail, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { DocumentFile } from "@office/features/orders/files";
import type { MailLanguage, MailOptions } from "@office/features/orders/mail";
import { loadSendFormAction, sendFilesAction } from "@office/features/orders/mail-actions";
import { Link } from "@office/i18n/navigation";
import { ToggleChip } from "@office/shared/components/form/toggle-chip";
import { Button } from "@office/shared/components/ui/button";
import { Checkbox } from "@office/shared/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import { Label } from "@office/shared/components/ui/label";
import { Textarea } from "@office/shared/components/ui/textarea";
import { formatFileSize } from "@office/shared/lib/utils";

export interface SendableDocument {
  id: number;
  /** What the files panel calls it: "Passport · Georgian → English". */
  label: string;
}

type Loaded = { options: MailOptions; documents: { id: number; files: DocumentFile[] }[] };
/** "client", or a translator's id. */
type Target = "client" | number;

/**
 * "Send by email": an order's files to its client, or to a translator
 * assigned to it, as attachments.
 *
 * Who it goes to is read from the record, never typed here, so a slip of
 * the keyboard cannot mail a passport scan to a stranger. A missing address
 * is fixed on the client's or the translator's own page, linked from the
 * notice. The dialog says where the message will come from before anything
 * is sent: the organisation's own mail server, or Suliko's address in the
 * organisation's name.
 *
 * Everything is loaded when the dialog opens and thrown away when it
 * closes, so it always shows the files as they are now.
 */
export function SendFilesDialog({
  orderId,
  clientId,
  documents,
  preselect = [],
}: {
  orderId: number;
  clientId: number;
  documents: SendableDocument[];
  /**
   * Files ticked on the files panel. With any, the dialog opens with exactly
   * those chosen and the button says how many; with none it proposes its
   * own (a client gets the translations).
   */
  preselect?: readonly string[];
}) {
  const t = useTranslations("files.send");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail /> {t("button")}
          {preselect.length > 0 && <span className="tabular-nums">({preselect.length})</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader icon={Mail} hue="blue">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open && (
          <SendForm
            orderId={orderId}
            clientId={clientId}
            documents={documents}
            preselect={preselect}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SendForm({
  orderId,
  clientId,
  documents,
  preselect,
  onDone,
}: {
  orderId: number;
  clientId: number;
  documents: SendableDocument[];
  preselect: readonly string[];
  onDone: () => void;
}) {
  const t = useTranslations("files.send");
  const tFiles = useTranslations("files");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>("client");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<MailLanguage>(locale === "en" ? "en" : "ka");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What a recipient is sent unless the sender says otherwise: a client gets
  // the translations, a translator the sources of their own documents.
  const defaults = (data: Loaded, to: Target) => {
    const theirs =
      to === "client"
        ? null
        : new Set(data.options.translators.find((p) => p.id === to)?.document_ids ?? []);
    const kind = to === "client" ? "translation" : "source";
    return new Set(
      data.documents
        .filter((doc) => theirs === null || theirs.has(doc.id))
        .flatMap((doc) => doc.files)
        .filter((file) => file.kind === kind && file.downloadable !== false)
        .map((file) => file.id),
    );
  };

  useEffect(() => {
    let cancelled = false;
    loadSendFormAction(
      orderId,
      documents.map((doc) => doc.id),
    )
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setLoadError(result.error);
          return;
        }
        setLoaded(result);
        // What was ticked on the panel, as far as it can still be sent.
        const ticked = result.documents
          .flatMap((doc) => doc.files)
          .filter((file) => preselect.includes(file.id) && file.downloadable !== false)
          .map((file) => file.id);
        setSelected(ticked.length > 0 ? new Set(ticked) : defaults(result, "client"));
      })
      .catch(() => {
        if (!cancelled) setLoadError(tFiles("errors.unreachable"));
      });
    return () => {
      cancelled = true;
    };
    // Loaded once per opening: the form is unmounted when the dialog closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const translator = useMemo(
    () =>
      target === "client" ? null : (loaded?.options.translators.find((p) => p.id === target) ?? null),
    [loaded, target],
  );

  if (loadError) {
    return (
      <DialogBody>
        <p role="alert" className="text-destructive text-sm">
          {loadError}
        </p>
      </DialogBody>
    );
  }
  if (!loaded) {
    return (
      <DialogBody>
        <p className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {tFiles("opening")}
        </p>
      </DialogBody>
    );
  }

  const { options } = loaded;
  const recipient = translator ?? options.client;
  // A translator is shown, and may be sent, only their own documents.
  const visible = loaded.documents
    .filter((doc) => translator === null || translator.document_ids.includes(doc.id))
    .filter((doc) => doc.files.length > 0);
  const offered = visible.flatMap((doc) => doc.files);
  const chosen = offered.filter((file) => selected.has(file.id));
  const weight = chosen.reduce((sum, file) => sum + (file.size_bytes ?? 0), 0);
  const tooHeavy = weight > options.max_bytes;

  const choose = (next: Target) => {
    setTarget(next);
    setSelected(defaults(loaded, next));
    setError(null);
  };

  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const canSend =
    !sending && chosen.length > 0 && !tooHeavy && recipient.email !== null && options.via !== null;

  async function send() {
    setError(null);
    setSending(true);
    try {
      const result = await sendFilesAction({
        orderId,
        to: translator ? "translator" : "client",
        translatorId: translator?.id,
        fileIds: chosen.map((file) => file.id),
        message,
        language,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(t("sent", { count: result.files, email: result.recipient }));
      onDone();
    } catch {
      setError(tFiles("errors.unreachable"));
    } finally {
      setSending(false);
    }
  }

  const labelOf = (id: number) => documents.find((doc) => doc.id === id)?.label ?? "";

  return (
    <form
      className={dialogFormClass}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) void send();
      }}
    >
      <DialogBody className="space-y-5">
        {/* Who: the client, or one of the translators working on the order. */}
        <div className="space-y-2">
          {options.translators.length > 0 && (
            <div role="group" aria-label={t("recipient")} className="flex flex-wrap gap-1.5">
              <ToggleChip
                pressed={target === "client"}
                onClick={() => choose("client")}
                className="h-8 px-3 text-xs font-medium"
              >
                {t("client")}
              </ToggleChip>
              {options.translators.map((person) => (
                <ToggleChip
                  key={person.id}
                  pressed={target === person.id}
                  onClick={() => choose(person.id)}
                  className="h-8 max-w-56 truncate px-3 text-xs font-medium"
                  title={person.name}
                >
                  {person.name}
                </ToggleChip>
              ))}
            </div>
          )}

          {recipient.email ? (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("to")}: </span>
              <span className="font-medium">{recipient.name}</span>{" "}
              <span className="text-muted-foreground break-all">({recipient.email})</span>
            </p>
          ) : (
            <p className="border-hue-amber-ink/30 bg-hue-amber-tint flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
              <AlertTriangle className="text-hue-amber-ink mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="font-medium">{recipient.name}</span>:{" "}
                {translator ? t("noEmailTranslator") : t("noEmailClient")}{" "}
                <Link
                  href={translator ? `/translators/${translator.id}/edit` : `/clients/${clientId}/edit`}
                  className="text-link font-medium whitespace-nowrap hover:underline"
                >
                  {t("addEmail")}
                </Link>
              </span>
            </p>
          )}
        </div>

        {/* What: every file of the order, grouped as the files panel groups them. */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{t("files")}</legend>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {translator ? t("noFilesFor") : t("noFiles")}
            </p>
          ) : (
            visible.map((doc) => (
              <div key={doc.id} className="space-y-1.5">
                {loaded.documents.length > 1 && (
                  <p className="text-muted-foreground text-xs">{labelOf(doc.id)}</p>
                )}
                <ul className="border-border divide-border divide-y rounded-md border">
                  {doc.files.map((file) => {
                    const inputId = `send-file-${file.id}`;
                    const locked = file.downloadable === false;
                    return (
                      <li key={file.id} className="flex items-center gap-3 px-3 py-2">
                        <Checkbox
                          id={inputId}
                          checked={selected.has(file.id)}
                          disabled={locked}
                          onCheckedChange={(state) => toggle(file.id, state === true)}
                        />
                        <label htmlFor={inputId} className="min-w-0 flex-1 text-sm">
                          <span className="block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {tFiles(file.kind)} · {formatFileSize(file.size_bytes)}
                            {locked && ` · ${t("inVault")}`}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
          {chosen.length > 0 && (
            <p
              className={
                tooHeavy ? "text-hue-red-ink text-xs font-medium" : "text-muted-foreground text-xs"
              }
            >
              {tooHeavy
                ? t("tooLarge", {
                    size: formatFileSize(weight),
                    max: formatFileSize(options.max_bytes),
                  })
                : t("selected", { count: chosen.length, size: formatFileSize(weight) })}
            </p>
          )}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="send-message">{t("message")}</Label>
          <Textarea
            id="send-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder={t("messagePlaceholder")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span id="send-language" className="text-sm font-medium">
            {t("language")}
          </span>
          <div role="group" aria-labelledby="send-language" className="flex gap-1.5">
            {(["ka", "en"] as const).map((code) => (
              <ToggleChip
                key={code}
                pressed={language === code}
                onClick={() => setLanguage(code)}
                className="h-8 px-3 text-xs font-medium"
              >
                {t(`languages.${code}`)}
              </ToggleChip>
            ))}
          </div>
        </div>

        {/* Where it comes from, so nobody is surprised by the sender's address. */}
        <p className="text-muted-foreground text-xs">
          {options.via === null
            ? t("notConfigured")
            : options.via === "smtp"
              ? t("fromOwn", { from: options.from_email ?? "" })
              : options.reply_to
                ? t("fromPlatform", { from: options.from_email ?? "", replyTo: options.reply_to })
                : t("fromPlatformNoReply", { from: options.from_email ?? "" })}
        </p>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" variant="brand" disabled={!canSend}>
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
          {sending ? t("sending") : t("submit")}
        </Button>
      </DialogFooter>
    </form>
  );
}
