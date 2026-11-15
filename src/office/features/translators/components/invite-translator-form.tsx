"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  Check,
  CircleAlert,
  Copy,
  Loader2,
  Mail,
  MailWarning,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { Link } from "@office/i18n/navigation";
import {
  inviteTranslatorAction,
  searchTranslatorAccountsAction,
  type TranslatorInviteFormState,
} from "@office/features/translators/actions";
import type { TranslatorCandidate } from "@office/features/translators/api";
import { Field, FormAlert, SubmitButton, useFocusOnError } from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { cn } from "@office/shared/lib/utils";

type Search = Awaited<ReturnType<typeof searchTranslatorAccountsAction>>;

/**
 * Invite a translator, and connect them to their suliko.ge account.
 *
 * The bureau types an email address or a phone number and sees EVERY suliko.ge
 * account that matches, not just one: two people can share a name, and a
 * translator may have signed up with a phone number and no address at all. They
 * pick the right person and the invite links to that account at once.
 *
 * Simpler than the staff invite form (`invite-form.tsx`): no role, no
 * permission checklist. A translator's access is the bureau's own directory
 * row plus whatever documents get assigned to it — not a Suliko Office login, so there
 * is nothing here to grant.
 */
export function InviteTranslatorForm({
  translatorId,
  defaultValues,
}: {
  /** Attach the invite to this existing directory row instead of creating one. */
  translatorId?: number;
  /** Prefilled from that row, on first render only — `state.values` wins after
   * a failed submit, so a rejected form never silently resets to these. */
  defaultValues?: { full_name?: string; email?: string; phone?: string };
}) {
  const locale = useLocale();
  const t = useTranslations("translators.inviteForm");
  const tc = useTranslations("common");
  const [state, formAction] = useActionState<TranslatorInviteFormState, FormData>(
    inviteTranslatorAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  useFocusOnError(formRef, state);

  const [login, setLogin] = useState(
    state.values?.login ?? defaultValues?.email ?? defaultValues?.phone ?? "",
  );
  const [fullName, setFullName] = useState(
    state.values?.full_name ?? defaultValues?.full_name ?? "",
  );
  const [picked, setPicked] = useState(state.values?.suliko_user_id ?? "");
  const [search, setSearch] = useState<Search>(null);
  const [searching, startSearch] = useTransition();

  const candidates: TranslatorCandidate[] = search?.ok ? search.candidates : [];
  const loginIsPhone = login.trim() !== "" && !login.includes("@");

  // Debounced, so the search runs once the address or number is typed, not per key.
  useEffect(() => {
    const timer = setTimeout(() => {
      startSearch(async () => {
        const found = await searchTranslatorAccountsAction(login);
        setSearch(found);
        if (!found?.ok) {
          setPicked("");
          return;
        }
        const free = found.candidates.filter((candidate) => !candidate.already_linked);
        // Keep the pick if it is still there; with exactly one person to choose,
        // choose them (the card says who) — otherwise the bureau decides.
        setPicked((current) =>
          free.some((candidate) => candidate.suliko_user_id === current)
            ? current
            : free.length === 1
              ? free[0].suliko_user_id
              : "",
        );
        if (free.length === 1) setFullName((current) => current || free[0].full_name);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [login]);

  function pick(candidate: TranslatorCandidate) {
    setPicked(candidate.suliko_user_id);
    // The name follows the pick unless the bureau typed their own.
    setFullName((current) =>
      !current || candidates.some((other) => other.full_name === current)
        ? candidate.full_name
        : current,
    );
  }

  if (state.invited) return <InviteSent invited={state.invited} />;

  return (
    <form ref={formRef} action={formAction} noValidate className="max-w-2xl space-y-6">
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />
      {translatorId !== undefined && (
        <input type="hidden" name="translator_id" value={translatorId} />
      )}

      <FormAlert message={state.error} stepUp={state.stepUp} />

      <Card>
        <CardContent className="grid gap-4 pt-6">
          <Field
            name="login"
            label={t("findLabel")}
            hint={t("findHint")}
            errors={state.fieldErrors?.email}
          >
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                id="login"
                name="login"
                // Not type="email": a phone number is a valid search.
                type="text"
                inputMode="email"
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                className="pl-9"
                aria-describedby="login-found"
              />
              {searching && (
                <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
              )}
            </div>
            <SearchNote search={search} loginIsPhone={loginIsPhone} />
          </Field>

          {candidates.length > 0 && (
            <Field
              name="suliko_user_id"
              label={t("userLabel")}
              hint={t("userHint")}
              errors={state.fieldErrors?.suliko_user_id}
            >
              <div role="radiogroup" aria-label={t("userLabel")} className="space-y-2">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.suliko_user_id}
                    candidate={candidate}
                    checked={picked === candidate.suliko_user_id}
                    onPick={() => pick(candidate)}
                  />
                ))}
              </div>
            </Field>
          )}

          <Field name="full_name" label={t("name")} errors={state.fieldErrors?.full_name}>
            <Input
              id="full_name"
              name="full_name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton label={t("send")} icon={<UserPlus />} />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/translators">{tc("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}

/** What the search found, said plainly: nobody, or suliko.ge could not be asked. */
function SearchNote({ search, loginIsPhone }: { search: Search; loginIsPhone: boolean }) {
  const t = useTranslations("translators.inviteForm");
  if (!search) return null;

  let text: string | null = null;
  let warn = false;
  if (!search.ok) {
    text = t("searchUnavailable");
    warn = true;
  } else if (search.candidates.length === 0) {
    text = loginIsPhone ? t("noAccountPhone") : t("noAccountEmail");
    warn = loginIsPhone; // a number cannot be invited without an account to pick
  } else {
    text = t("matches", { count: search.candidates.length });
  }

  return (
    <p
      id="login-found"
      role="status"
      className={cn(
        "flex items-start gap-1.5 text-xs",
        warn ? "text-status-warning" : "text-muted-foreground",
      )}
    >
      {warn ? (
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      ) : (
        <UserCheck className="text-status-success mt-0.5 size-3.5 shrink-0" aria-hidden />
      )}
      <span>{text}</span>
    </p>
  );
}

/**
 * One matching account, as a radio card: who they are, and the contacts that
 * tell two people with the same name apart. The contacts are their profile ones
 * — they can edit those freely — so they are for recognising someone, and the
 * bureau confirms the person by picking.
 */
function CandidateCard({
  candidate,
  checked,
  onPick,
}: {
  candidate: TranslatorCandidate;
  checked: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("translators.inviteForm");
  const contacts = [candidate.email, candidate.phone].filter(Boolean).join(" · ");
  const taken = candidate.already_linked;

  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
        taken ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        checked
          ? "border-suliko-default-color bg-suliko-default-color/[0.06]"
          : "border-border hover:bg-muted/50",
      )}
    >
      <input
        type="radio"
        name="suliko_user_id"
        value={candidate.suliko_user_id}
        checked={checked}
        disabled={taken}
        onChange={onPick}
        className="mt-1 size-4 shrink-0 accent-[var(--suliko-default-color)]"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{candidate.full_name}</span>
        <span className="text-muted-foreground block text-xs break-all">
          {contacts || t("noContact")}
        </span>
        {taken && (
          <span className="text-status-warning mt-1 block text-xs">
            {t("alreadyLinked", { name: candidate.linked_translator_name ?? "" })}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Shown once, after the invite is sent.
 *
 * The pending outcome IS the deliverable here, not a stepping stone: the
 * address the invitee must register with is the one thing the inviter may
 * need to hand over themselves if the email does not arrive.
 */
function InviteSent({
  invited,
}: {
  invited: NonNullable<TranslatorInviteFormState["invited"]>;
}) {
  const t = useTranslations("translators.inviteForm");
  const [copied, setCopied] = useState(false);
  const linked = invited.inviteStatus === "linked";
  // Nothing to resend when there was never an address: not a failure.
  const warn = !linked || (!invited.emailSent && !invited.noEmail);

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-start gap-3">
          {warn ? (
            <MailWarning className="text-status-warning mt-0.5 size-5 shrink-0" aria-hidden />
          ) : (
            <Mail className="text-status-success mt-0.5 size-5 shrink-0" aria-hidden />
          )}
          <div className="space-y-1">
            <p className="font-medium">{t("invited", { name: invited.fullName })}</p>
            <p className="text-muted-foreground text-sm">
              {linked
                ? invited.noEmail
                  ? t("linkedNoEmail", { account: invited.matchedDisplayName ?? invited.fullName })
                  : invited.matchedDisplayName
                    ? t("linkedNamed", { account: invited.matchedDisplayName })
                    : t("linked")
                : t("pending")}
            </p>
            {!invited.emailSent && !invited.noEmail && (
              <p className="text-status-warning text-sm">
                {linked ? t("emailFailed") : t("emailFailedPass")}
              </p>
            )}
          </div>
        </div>

        {!linked && (
          <div className="bg-muted space-y-1 rounded-md p-4 font-mono text-sm">
            <p className="break-all">{t("registerWith", { email: invited.email })}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!linked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(invited.email).then(
                  () => setCopied(true),
                  () => setCopied(false),
                );
              }}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? t("copied") : t("copyAddress")}
            </Button>
          )}
          <Button variant="brand" size="sm" asChild>
            <Link href="/translators">{t("done")}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/translators/invite">{t("inviteAnother")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
