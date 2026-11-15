"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Loader2, Pin, PinOff, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  addCommentAction,
  deleteCommentAction,
  mentionablePeopleAction,
  pinCommentAction,
  type ActionState,
} from "@office/features/notifications/actions";
import type { MentionablePerson, OrderComment } from "@office/features/notifications/api";
import { FormAlert } from "@office/shared/components/form/fields";
import { useTimezone } from "@office/shared/components/timezone-context";
import { Button } from "@office/shared/components/ui/button";
import { formatDateTime } from "@office/shared/lib/dates";
import { cn } from "@office/shared/lib/utils";

/**
 * Internal notes on an order.
 *
 * Client-side only for the compose box and the pin/delete buttons; the list
 * itself is passed in already rendered by the server.
 *
 * Note what is missing: an edit button. A note is a record of what someone
 * said at the time, and the API refuses to change the body for that reason.
 */

/**
 * The "@name" being typed at the caret, if any: where it starts and what has
 * been typed after the "@". An "@" in the middle of a word (an email address)
 * is not a mention being started.
 */
function mentionAtCaret(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const match = /(^|\s)@([^\s@]*)$/.exec(before);
  if (!match) return null;
  return { start: before.length - match[2].length - 1, query: match[2].toLowerCase() };
}

function matches(person: MentionablePerson, query: string): boolean {
  if (!query) return true;
  const name = person.full_name.toLowerCase();
  return (
    person.handle.toLowerCase().startsWith(query) ||
    name.startsWith(query) ||
    name.split(/\s+/).some((word) => word.startsWith(query))
  );
}

function CommentForm({ orderId, canMention }: { orderId: number; canMention: boolean }) {
  const t = useTranslations("comments");
  const [state, action, pending] = useActionState<ActionState, FormData>(addCommentAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Controlled, so choosing a colleague can rewrite the "@..." being typed.
  const [text, setText] = useState(state.body ?? "");
  const [people, setPeople] = useState<MentionablePerson[] | null>(null);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);

  const options =
    canMention && mention && people
      ? people.filter((person) => matches(person, mention.query)).slice(0, 6)
      : [];
  const open = options.length > 0;

  // Clear only on success; a failed post hands the text back instead, so a
  // long note is not lost to a dropped connection.
  useEffect(() => {
    if (!state.ok) return;
    setText("");
    setMention(null);
    formRef.current?.reset();
    toast.success(t("posted"));
  }, [state, t]);

  function track(value: string, caret: number) {
    setText(value);
    const found = canMention ? mentionAtCaret(value, caret) : null;
    setMention(found);
    setActive(0);
    // The colleagues are fetched the first time someone types an "@", not on
    // every page view.
    if (found && people === null) {
      setPeople([]);
      void mentionablePeopleAction(orderId).then(setPeople);
    }
  }

  function choose(person: MentionablePerson) {
    if (!mention) return;
    const caret = textRef.current?.selectionStart ?? text.length;
    const next = `${text.slice(0, mention.start)}@${person.handle} ${text.slice(caret)}`;
    const position = mention.start + person.handle.length + 2;
    setText(next);
    setMention(null);
    requestAnimationFrame(() => {
      textRef.current?.focus();
      textRef.current?.setSelectionRange(position, position);
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const person = options[active];
      if (person) choose(person);
    } else if (event.key === "Escape") {
      setMention(null);
    }
  }

  const bodyId = `comment-body-${orderId}`;
  const hintId = `${bodyId}-hint`;

  // A visible label rather than the placeholder alone, which disappears as
  // soon as anyone types (audit F25). The @mention hint only where there is
  // a team to mention: a freelancer works alone.
  return (
    <form ref={formRef} action={action} noValidate className="space-y-2">
      <input type="hidden" name="order_id" value={orderId} />
      <FormAlert message={state.error} stepUp={state.stepUp} />
      <label htmlFor={bodyId} className="text-sm font-medium">
        {t("label")}
      </label>
      <div className="relative">
        <textarea
          ref={textRef}
          id={bodyId}
          name="body"
          rows={3}
          maxLength={5000}
          required
          aria-describedby={hintId}
          role={canMention ? "combobox" : undefined}
          aria-expanded={canMention ? open : undefined}
          aria-controls={canMention ? `${bodyId}-people` : undefined}
          aria-autocomplete={canMention ? "list" : undefined}
          aria-activedescendant={open ? `${bodyId}-person-${active}` : undefined}
          value={text}
          onChange={(event) => track(event.target.value, event.target.selectionStart)}
          onKeyDown={onKeyDown}
          onKeyUp={(event) => {
            // The caret moved without typing: re-read what is under it.
            if (event.key.startsWith("Arrow") && !open) {
              track(event.currentTarget.value, event.currentTarget.selectionStart);
            }
          }}
          onClick={(event) => track(event.currentTarget.value, event.currentTarget.selectionStart)}
          onBlur={() => setMention(null)}
          placeholder={t("placeholder")}
          className={cn(
            "border-input bg-background w-full resize-y rounded-md border px-3 py-2 text-sm shadow-xs",
            "focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
          )}
        />
        {open && (
          <ul
            id={`${bodyId}-people`}
            role="listbox"
            aria-label={t("peopleLabel")}
            className="bg-popover absolute z-20 mt-1 w-full max-w-sm overflow-hidden rounded-md border shadow-md"
          >
            {options.map((person, index) => (
              <li
                key={person.handle}
                id={`${bodyId}-person-${index}`}
                role="option"
                aria-selected={index === active}
                // mousedown, not click: the textarea's blur would close the list first.
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(person);
                }}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer items-baseline gap-2 px-3 py-2 text-sm",
                  index === active && "bg-accent",
                )}
              >
                <span className="font-medium">{person.full_name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {person.position ?? `@${person.handle}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p id={hintId} className="text-muted-foreground text-xs">
          {t("internalOnly")}
          {canMention && <> {t("mentionHint")}</>}
        </p>
        <Button type="submit" variant="brand" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          {t("post")}
        </Button>
      </div>
    </form>
  );
}

function CommentActions({
  comment,
  canDelete,
}: {
  comment: OrderComment;
  canDelete: boolean;
}) {
  const t = useTranslations("comments");
  const [pinState, pinAction, pinPending] = useActionState<ActionState, FormData>(
    pinCommentAction,
    {},
  );
  const [removeState, removeAction, removePending] = useActionState<ActionState, FormData>(
    deleteCommentAction,
    {},
  );
  const error = pinState.error ?? removeState.error;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <form action={pinAction}>
          <input type="hidden" name="order_id" value={comment.order_id} />
          <input type="hidden" name="comment_id" value={comment.id} />
          <input type="hidden" name="is_pinned" value={String(!comment.is_pinned)} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={pinPending}
            title={comment.is_pinned ? t("unpin") : t("pin")}
            aria-label={comment.is_pinned ? t("unpin") : t("pin")}
            aria-pressed={comment.is_pinned}
          >
            {comment.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          </Button>
        </form>

        {canDelete && (
          <form
            action={removeAction}
            onSubmit={(event) => {
              if (!window.confirm(t("deleteConfirm"))) event.preventDefault();
            }}
          >
            <input type="hidden" name="order_id" value={comment.order_id} />
            <input type="hidden" name="comment_id" value={comment.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={removePending}
              title={t("delete")}
              aria-label={t("delete")}
              className="hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </form>
        )}
      </div>
      {error && (
        <p role="alert" className="text-destructive max-w-48 text-right text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

/** Renders @mentions as highlighted spans. Plain text otherwise — never HTML. */
function Body({ text }: { text: string }) {
  const parts = text.split(/(@[A-Za-z0-9._@+-]{2,100})/g);
  return (
    <p className="text-sm whitespace-pre-wrap">
      {parts.map((part, index) =>
        part.startsWith("@") ? (
          <span key={index} className="text-link font-medium">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function CommentThread({
  orderId,
  comments,
  currentUserId,
  canModerate,
  canMention = false,
}: {
  orderId: number;
  comments: OrderComment[];
  currentUserId: number;
  /** `orders.delete` — lets someone remove a note they did not write. */
  canModerate: boolean;
  /** The plan has a team and notifications, so an @mention reaches someone. */
  canMention?: boolean;
}) {
  const t = useTranslations("comments");
  const timeZone = useTimezone();

  return (
    <div className="space-y-4">
      <CommentForm orderId={orderId} canMention={canMention} />

      {comments.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{t("none")}</p>
      ) : (
        <ul className="divide-border divide-y">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={cn("py-3", comment.is_pinned && "bg-status-warning/[0.06] -mx-2 px-2")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium">{comment.author_name}</span>
                    <time className="text-muted-foreground text-xs tabular-nums">
                      {formatDateTime(comment.created_at, timeZone)}
                    </time>
                    {comment.is_pinned && (
                      <span className="text-status-warning inline-flex items-center gap-1 text-xs font-medium">
                        <Pin className="size-3" aria-hidden /> {t("pinned")}
                      </span>
                    )}
                  </div>
                  <Body text={comment.body} />
                </div>

                <CommentActions
                  comment={comment}
                  canDelete={canModerate || comment.author_user_id === currentUserId}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
