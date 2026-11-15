"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  Check,
  CircleAlert,
  Copy,
  Link2,
  Loader2,
  Mail,
  MailWarning,
  Phone,
  Search,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  inviteUserAction,
  lookupAccountAction,
  suggestPeopleAction,
  type InviteFormState,
} from "@office/features/users/actions";
import type { AccountLookup, SulikoSuggestion } from "@office/features/users/api";
import { PermissionChecklist } from "@office/features/users/components/permission-checklist";
import { guardedAction } from "@office/features/users/guarded-action";
import type { PermissionGroup } from "@office/features/users/permission-catalogue";
import type { AssignableRole } from "@office/features/users/schema";
import { Link } from "@office/i18n/navigation";
import {
  permissionsForRole,
  type Permission,
  type Role,
} from "@office/shared/auth/permissions";
import {
  Field,
  FormAlert,
  SubmitButton,
  selectClass,
  useFocusOnError,
} from "@office/shared/components/form/fields";
import { UnsavedChangesGuard } from "@office/shared/components/form/unsaved-changes-guard";
import { useTimezone } from "@office/shared/components/timezone-context";
import { cn } from "@office/shared/lib/utils";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Input } from "@office/shared/components/ui/input";
import { formatDateTime } from "@office/shared/lib/dates";

interface InviteFormProps {
  groups: PermissionGroup[];
  /** What the INVITER holds. Nobody may hand out access they lack. */
  grantable: readonly Permission[];
  /** The roles the inviter may hand out: their own and every one below it. */
  roles: readonly AssignableRole[];
}

/**
 * The invite form: who they are, and what they may do.
 *
 * The email or phone number comes first and is searched as it is typed: a
 * person with a Suliko account already is invited to accept (their password is
 * theirs); anyone else gets an email asking them to register first. A phone
 * number can only invite someone suliko.ge already knows. Picking a role reshapes the
 * checkboxes rather than replacing them — the role is a starting point the
 * owner then adjusts, which is exactly what the API stores.
 *
 * It steers to the number. suliko.ge registers people with a phone number or
 * Google, and an invitation matches the sign-in name they proved: a number
 * always matches someone who is on suliko.ge, an address only someone who used
 * Google. So under the box, while it does not hold a number, a line says so
 * and a button switches the box to number mode.
 */
export function InviteForm({ groups, grantable, roles }: InviteFormProps) {
  const t = useTranslations("users");
  const locale = useLocale();
  // If the call itself fails (not the API refusing: that already has its own
  // message) the person may have just invited someone, so the message says to
  // look at the list before trying again.
  const action = useMemo(
    () => guardedAction(inviteUserAction, t("callFailed")),
    [t],
  );
  const [state, formAction] = useActionState<InviteFormState, FormData>(
    action,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);
  useFocusOnError(formRef, state);

  const [login, setLogin] = useState(state.values?.login ?? "");
  const [numberMode, setNumberMode] = useState(false);
  const [phone, setPhone] = useState(state.values?.phone ?? "");
  // A number in the search box is who is invited, so the Phone field below only
  // mirrors it; an address leaves the field free for their contact number.
  const loginIsPhone = login.trim() !== "" && !login.includes("@");
  const [fullName, setFullName] = useState(state.values?.full_name ?? "");
  const [found, setFound] = useState<AccountLookup | null>(null);
  const [searching, startSearch] = useTransition();

  // Someone chosen from the dropdown. From then on the form carries only their
  // suliko.ge id: the API holds the address or number they sign in with.
  const [picked, setPicked] = useState<SulikoSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<SulikoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [suggesting, startSuggest] = useTransition();

  // People on suliko.ge whose email or phone starts with what is typed. A
  // little quicker than the exact search below, and it stops once someone is
  // chosen. Out-of-date answers are dropped so a slow reply cannot overwrite a
  // newer one.
  useEffect(() => {
    if (picked || login.trim().length < 4) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      startSuggest(async () => {
        const people = await suggestPeopleAction(login);
        if (!current) return;
        setSuggestions(people);
        setActive(
          Math.max(
            0,
            people.findIndex((person) => !person.member && !person.pending),
          ),
        );
        setOpen(people.length > 0);
      });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [login, picked]);

  function pick(person: SulikoSuggestion) {
    if (person.member || person.pending) return;
    setPicked(person);
    setOpen(false);
    setSuggestions([]);
    setFound(null);
    // Fill the name in, unless the inviter typed their own: one we filled for a
    // previous choice is replaced.
    setFullName((name) =>
      !name || name === picked?.full_name ? person.full_name : name,
    );
  }

  function unpick() {
    setFullName((name) => (name === picked?.full_name ? "" : name));
    setPicked(null);
    setLogin("");
    setFound(null);
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(
        (index) => (index - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      // Choosing someone must not submit the form.
      event.preventDefault();
      const person = suggestions[active];
      if (person) pick(person);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // Debounced, so the search runs once the address is typed, not per key.
  useEffect(() => {
    if (picked) return;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const result = await lookupAccountAction(login);
        setFound(result);
        // An existing account brings its own name; fill it in if still blank.
        const name = result?.exists ? result.full_name : null;
        if (name) setFullName((current) => current || name);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [login, picked]);

  const [role, setRole] = useState<Role>("staff");
  const [checked, setChecked] = useState<Set<Permission>>(
    () => new Set(permissionsForRole("staff")),
  );

  const held = new Set(grantable);

  /** Start over in number mode: clear the box and put the cursor in it. */
  function switchToNumber() {
    setLogin("");
    setFound(null);
    setNumberMode(true);
    loginRef.current?.focus();
  }

  function applyRole(next: Role) {
    setRole(next);
    // Only what the inviter can actually hand out — a manager picking the
    // "admin" role must not silently pre-tick boxes the API will refuse.
    setChecked(new Set(permissionsForRole(next).filter((p) => held.has(p))));
  }

  function toggle(permission: Permission) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  if (state.invited) return <InviteSent invited={state.invited} />;

  const blocked = Boolean(
    found?.member || found?.pending || (loginIsPhone && found && !found.exists),
  );
  const foundText = !found
    ? null
    : found.member
      ? t("foundMember")
      : found.pending
        ? t("foundPending")
        : found.exists
          ? t(loginIsPhone ? "foundAccountByPhone" : "foundAccount", {
              name: found.full_name ?? "",
            })
          : loginIsPhone
            ? t("foundNobodyPhone")
            : found.registration_required
              ? t("foundNobodyRegister")
              : t("foundNobody");

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="max-w-3xl space-y-6"
    >
      <UnsavedChangesGuard formRef={formRef} />
      <input type="hidden" name="locale" value={locale} />

      <FormAlert message={state.error} stepUp={state.stepUp} />

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field
            name="login"
            label={t("findByLogin")}
            hint={picked ? undefined : t("findByLoginHint")}
            errors={state.fieldErrors?.email}
            className="sm:col-span-2"
          >
            {picked ? (
              <div className="bg-muted/40 flex items-center gap-3 rounded-md border px-3 py-2">
                <UserCheck
                  className="text-status-success size-4 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {picked.full_name}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    {picked.kind === "email" ? (
                      <Mail className="size-3" aria-hidden />
                    ) : (
                      <Phone className="size-3" aria-hidden />
                    )}
                    {picked.contact}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={unpick}
                >
                  <X />
                  {t("pickedChange")}
                </Button>
                <input
                  type="hidden"
                  name="suliko_user_id"
                  value={picked.suliko_id}
                />
              </div>
            ) : (
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
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="login-suggestions"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    open ? `login-suggestion-${active}` : undefined
                  }
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  onBlur={() => setOpen(false)}
                  onFocus={() => setOpen(suggestions.length > 0)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  required
                  className="pl-9"
                  aria-describedby="login-found"
                />
                {(searching || suggesting) && (
                  <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
                )}
                {open && suggestions.length > 0 && (
                  <ul
                    id="login-suggestions"
                    role="listbox"
                    aria-label={t("suggestionsLabel")}
                    className="bg-popover absolute z-20 mt-1 w-full overflow-hidden rounded-md border shadow-md"
                  >
                    {suggestions.map((person, index) => {
                      const taken = person.member || person.pending;
                      return (
                        <li
                          key={person.suliko_id}
                          id={`login-suggestion-${index}`}
                          role="option"
                          aria-selected={index === active}
                          aria-disabled={taken}
                          // mousedown, not click: the input's blur would close the list first.
                          onMouseDown={(event) => {
                            event.preventDefault();
                            pick(person);
                          }}
                          onMouseEnter={() => setActive(index)}
                          className={
                            "flex items-center gap-3 px-3 py-2 text-sm " +
                            (taken
                              ? "cursor-not-allowed opacity-60 "
                              : "cursor-pointer ") +
                            (index === active ? "bg-accent" : "")
                          }
                        >
                          {person.kind === "email" ? (
                            <Mail
                              className="text-muted-foreground size-4 shrink-0"
                              aria-hidden
                            />
                          ) : (
                            <Phone
                              className="text-muted-foreground size-4 shrink-0"
                              aria-hidden
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {person.full_name}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {person.contact}
                            </span>
                          </span>
                          {taken && (
                            <span className="text-status-warning text-xs">
                              {person.member
                                ? t("suggestMember")
                                : t("suggestPending")}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
            {picked && (
              <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                <UserCheck
                  className="text-status-success mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                <span>{t("pickedHint")}</span>
              </p>
            )}
            {foundText && (
              <p
                id="login-found"
                role="status"
                className={
                  blocked
                    ? "text-status-warning flex items-start gap-1.5 text-xs"
                    : "text-muted-foreground flex items-start gap-1.5 text-xs"
                }
              >
                {blocked ? (
                  <CircleAlert
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                  />
                ) : found?.exists ? (
                  <UserCheck
                    className="text-status-success mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                  />
                ) : (
                  <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                )}
                <span>{foundText}</span>
              </p>
            )}
            {/* Steer to the number: it matches whoever is on suliko.ge, an
                address only someone who registered there with Google. */}
            {!loginIsPhone && !(numberMode && login === "") && (
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                <span>{t("steerToNumber")}</span>
                <button
                  type="button"
                  onClick={switchToNumber}
                  className="text-link font-medium underline-offset-2 hover:underline"
                >
                  {t("useNumber")}
                </button>
              </p>
            )}
          </Field>

          <Field
            name="full_name"
            label={t("fullName")}
            errors={state.fieldErrors?.full_name}
          >
            <Input
              id="full_name"
              name="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </Field>

          <Field
            name="position"
            label={t("position")}
            hint={t("positionHint")}
            errors={state.fieldErrors?.position}
          >
            <Input
              id="position"
              name="position"
              defaultValue={state.values?.position ?? ""}
              placeholder={t("positionPlaceholder")}
            />
          </Field>

          {!picked && (
            <Field
              name="phone"
              label={t("phone")}
              hint={loginIsPhone ? t("phoneFromSearch") : undefined}
              errors={state.fieldErrors?.phone}
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={loginIsPhone ? login : phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={loginIsPhone}
                autoComplete="tel"
              />
            </Field>
          )}

          <Field
            name="role"
            label={t("role")}
            hint={t("roleHint")}
            errors={state.fieldErrors?.role}
            className="sm:col-span-2"
          >
            <select
              id="role"
              name="role"
              className={selectClass}
              value={role}
              onChange={(event) => applyRole(event.target.value as Role)}
            >
              {roles.map((option) => (
                <option key={option} value={option}>
                  {t(`roles.${option}`)}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div>
            <h2 className="font-semibold">{t("whatTheyCanDo")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("whatTheyCanDoHint")}
            </p>
          </div>

          <PermissionChecklist
            groups={groups}
            checked={checked}
            onToggle={toggle}
            grantable={held}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton label={t("sendInvitation")} icon={<UserPlus />} />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}

/**
 * Shown once, after the invite is sent.
 *
 * The invitation link is here because it is not recoverable: the API stores
 * only its hash. If the email bounces or is delayed, this panel is the only
 * way the invite completes without starting over — so it does not navigate
 * away on its own. The link works once and expires, unlike the one-time
 * password it replaced, which stayed valid in an inbox until changed.
 */
export function InviteSent({
  invited,
  resent = false,
}: {
  invited: NonNullable<InviteFormState["invited"]>;
  /** A new link for someone already added: no "invite another" beside it. */
  resent?: boolean;
}) {
  const t = useTranslations("users");
  const timeZone = useTimezone();
  const [copied, setCopied] = useState(false);

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-start gap-3">
          {invited.emailSent || invited.invitedByPhone ? (
            <Mail
              className="text-status-success mt-0.5 size-5 shrink-0"
              aria-hidden
            />
          ) : invited.emailPending ? (
            // Not known to have left, not known to have failed: neither colour.
            <Mail
              className="text-muted-foreground mt-0.5 size-5 shrink-0"
              aria-hidden
            />
          ) : (
            <MailWarning
              className="text-status-warning mt-0.5 size-5 shrink-0"
              aria-hidden
            />
          )}
          <div className="space-y-1">
            <p className="font-medium">
              {t(resent ? "resentTitle" : "sentTitle", {
                name: invited.fullName,
              })}
            </p>
            <p className="text-muted-foreground text-sm">
              {invited.invitedByPhone
                ? t("sentByPhone")
                : invited.emailSent
                  ? t("sentEmailed", { email: invited.email })
                  : invited.emailPending
                    ? t("sentSlow", { email: invited.email })
                    : t("sentNotEmailed", { email: invited.email })}
            </p>
            {/* One sentence about their account, not two. Whether they already
                have an account here decides what they will do with the link;
                suliko.ge's records only matter when they have none. */}
            <p
              className={cn(
                "text-sm",
                // Something they must do first, so it is not grey like the rest.
                invited.needsRegistration
                  ? "text-status-warning"
                  : "text-muted-foreground",
              )}
            >
              {invited.needsRegistration
                ? t("sentNeedsRegistration")
                : invited.existingAccount
                  ? t("sentExisting")
                  : invited.sulikoAccountStatus === "linked"
                    ? t("sentLinked", {
                        name: invited.sulikoAccountMatchedName
                          ? ` (${invited.sulikoAccountMatchedName})`
                          : "",
                      })
                    : t("sentNewAccount")}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Link2 className="size-4" aria-hidden /> {t("inviteLink")}
          </p>
          <p className="bg-muted rounded-md p-3 font-mono text-xs break-all">
            {invited.inviteLink}
          </p>
          <p className="text-muted-foreground text-xs">
            {t("inviteLinkHint", {
              date: formatDateTime(invited.inviteExpiresAt, timeZone),
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(invited.inviteLink).then(
                () => setCopied(true),
                () => setCopied(false),
              );
            }}
          >
            {copied ? <Check /> : <Copy />}
            {t("copyLink")}
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link href="/users">{t("done")}</Link>
          </Button>
          {!resent && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users/invite">{t("inviteAnother")}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
