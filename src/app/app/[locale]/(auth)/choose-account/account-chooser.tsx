"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Coins,
  Loader2,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Link } from "@office/i18n/navigation";
import {
  type AuthFormState,
  createBureauAction,
  type LoginOptions,
  selectAccountAction,
} from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";
import { cn } from "@office/shared/lib/utils";

/**
 * One row per place to go. Each is a submit button whose own name/value is
 * the pick — only the clicked button is posted — so the list works as one
 * plain form, and the chosen row shows the spinner.
 */
function Choice({
  id,
  name,
  value,
  icon,
  title,
  subtitle,
  badge,
  chosen,
  onChoose,
}: {
  id: string;
  name: "tenant_slug" | "personal";
  value: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  chosen: string | null;
  onChoose: (id: string) => void;
}) {
  const { pending } = useFormStatus();
  const busy = pending && chosen === id;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={() => onChoose(id)}
      className={cn(
        "border-border hover:border-suliko-default-color hover:bg-suliko-default-color/5",
        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        "disabled:cursor-wait disabled:opacity-70",
      )}
    >
      <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{title}</span>
          {badge && (
            <span className="bg-status-warning/15 text-status-warning rounded-full px-2 py-0.5 text-xs font-semibold uppercase">
              {badge}
            </span>
          )}
        </span>
        <span className="text-muted-foreground block text-xs">{subtitle}</span>
      </span>
      {busy ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : (
        <ChevronRight className="text-muted-foreground size-4" aria-hidden />
      )}
    </button>
  );
}

function CreateSubmit() {
  const t = useTranslations("auth.choose");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin" /> : null}
      {t("createBureauSubmit")}
      {!pending && <ArrowRight aria-hidden />}
    </Button>
  );
}

/**
 * Found a new bureau, owned by this account — what sign-up does, minus the
 * account it already has. Its own form: forms cannot nest, and the chooser's
 * rows are submit buttons of theirs. A small offer, always shown, that opens
 * into the name box on click.
 */
function CreateBureau({ next }: { next: string }) {
  const t = useTranslations("auth.choose");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          // A create action: brand-blue tint, so it reads apart from the neutral account
          // rows above and from the grey "other account" button below.
          "border-suliko-default-color/50 bg-suliko-default-color/5 text-link hover:bg-suliko-default-color/10",
          "flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors",
        )}
      >
        <Plus className="size-4" />
        {t("createBureau")}
      </button>
    );
  }

  return <BureauForm next={next} />;
}

/** The bureau's name, and the button that founds it. */
function BureauForm({ next }: { next: string }) {
  const t = useTranslations("auth.choose");
  const ta = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    createBureauAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="border-border space-y-3 rounded-lg border px-4 py-3"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="organisation_name">
          {ta("signupOrganisation")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="organisation_name"
          name="organisation_name"
          defaultValue={state.values?.organisation_name ?? ""}
          autoComplete="organization"
          required
          minLength={2}
          maxLength={255}
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby="organisation_name-hint"
        />
        <p
          id="organisation_name-hint"
          className="text-muted-foreground text-xs"
        >
          {ta("signupOrganisationHint")} {t("createBureauOwner")}
        </p>
      </div>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <CreateSubmit />
    </form>
  );
}

/**
 * "May other bureaus send you orders?" Two radios and neither is picked, so
 * nobody agrees (or declines) by tapping through. Submitting with neither
 * picked says so, in `state.error`, rather than guessing.
 */
function PersonalActivation({ next }: { next: string }) {
  const t = useTranslations("auth.choose");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    selectAccountAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="border-border bg-muted/30 space-y-3 rounded-lg border px-4 py-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="personal" value="1" />
      <input type="hidden" name="consent_asked" value="1" />
      <fieldset className="space-y-3">
        <legend className="mb-3 flex items-start gap-3 text-sm font-medium">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Coins className="size-5" aria-hidden />
          </span>
          <span className="pt-1.5">{t("consentLegend")}</span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["yes", "no"] as const).map((value) => {
            const yes = value === "yes";
            return (
              <label
                key={value}
                className={cn(
                  "group flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-colors",
                  "border-border hover:bg-muted/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2",
                  yes
                    ? "has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10 has-[:focus-visible]:ring-emerald-500"
                    : "has-[:checked]:border-slate-500 has-[:checked]:bg-slate-500/10 has-[:focus-visible]:ring-slate-500",
                )}
              >
                <input
                  type="radio"
                  name="bureau_orders"
                  value={value}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "text-muted-foreground mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                    yes
                      ? "peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white"
                      : "peer-checked:border-slate-500 peer-checked:bg-slate-500 peer-checked:text-white",
                  )}
                >
                  {yes ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <X className="size-3.5" aria-hidden />
                  )}
                </span>
                <span>{yes ? t("consentYes") : t("consentNo")}</span>
              </label>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">{t("consentHint")}</p>
      </fieldset>
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <ContinueSubmit />
    </form>
  );
}

function ContinueSubmit() {
  const t = useTranslations("auth.choose");
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin" /> : null}
      {t("continue")}
      {!pending && <ArrowRight aria-hidden />}
    </Button>
  );
}

/**
 * Small line illustrations for the two cards, in the brand colour at low
 * opacity so they sit behind the text. Decorative.
 */
function FreelancerArt() {
  return (
    <svg viewBox="0 0 120 90" fill="none" aria-hidden className="size-full">
      <rect
        x="52"
        y="12"
        width="46"
        height="60"
        rx="6"
        className="fill-current opacity-10"
      />
      <rect
        x="52"
        y="12"
        width="46"
        height="60"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M61 28h28M61 38h28M61 48h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="30" cy="38" r="12" className="fill-current opacity-20" />
      <circle cx="30" cy="38" r="12" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 76c2-14 12-20 22-20s20 6 22 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="94" cy="68" r="11" className="fill-amber-400" />
      <path
        d="M94 62v12M90 66h6a2.5 2.5 0 010 5h-6"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BureauArt() {
  return (
    <svg viewBox="0 0 120 90" fill="none" aria-hidden className="size-full">
      <rect
        x="40"
        y="10"
        width="40"
        height="54"
        rx="4"
        className="fill-current opacity-10"
      />
      <rect
        x="40"
        y="10"
        width="40"
        height="54"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M49 22h8M63 22h8M49 33h8M63 33h8M49 44h8M63 44h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M54 64v-8h12v8" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="52" r="8" className="fill-current opacity-20" />
      <circle cx="18" cy="52" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 78c1-9 7-13 14-13s13 4 14 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="102" cy="52" r="8" className="fill-current opacity-20" />
      <circle cx="102" cy="52" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M88 78c1-9 7-13 14-13s13 4 14 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** One of the two big cards a brand-new account picks between. */
function KindCard({
  art,
  title,
  body,
  points,
  selected,
  onSelect,
}: {
  art: React.ReactNode;
  title: string;
  body: string;
  points: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("auth.choose");
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex h-full flex-col items-start gap-3 rounded-xl border-2 px-5 py-6 text-left outline-none",
        "focus-visible:ring-suliko-default-color/50 focus-visible:ring-4",
        "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
        "hover:border-suliko-default-color/60",
        selected
          ? "border-suliko-default-color bg-suliko-default-color/5 shadow-md"
          : "border-border bg-card",
      )}
    >
      {selected && (
        <span className="suliko-default-bg absolute top-3 right-3 grid size-5 place-items-center rounded-full text-white">
          <Check className="size-3.5" aria-hidden />
        </span>
      )}
      <span
        className={cn(
          "bg-suliko-default-color/5 text-suliko-default-color mb-1 block h-24 w-full rounded-lg p-2 transition-colors",
          selected && "bg-suliko-default-color/10",
        )}
      >
        {art}
      </span>
      <span className="text-lg leading-tight font-semibold">{title}</span>
      <span className="text-foreground/70 text-sm leading-relaxed">{body}</span>
      <ul className="text-foreground/80 space-y-1.5 text-sm">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <Check
              className="text-suliko-default-color mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            {point}
          </li>
        ))}
      </ul>
      <span
        className={cn(
          "mt-auto flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
          selected
            ? "border-suliko-default-color text-suliko-default-color"
            : "border-border text-foreground/70",
          "group-hover:border-suliko-default-color group-hover:text-suliko-default-color",
        )}
      >
        {t("pick")}
        <ChevronRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </button>
  );
}

/**
 * First sign-in of an account with no workspace anywhere: freelancer or
 * bureau, side by side. Nothing is created until the person has picked one and
 * answered what it asks (the consent question, or the bureau's name).
 */
function NewAccount({ next }: { next: string }) {
  const t = useTranslations("auth.choose");
  const [kind, setKind] = useState<"freelancer" | "bureau" | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
        <KindCard
          art={<FreelancerArt />}
          title={t("freelancerTitle")}
          body={t("freelancerBody")}
          points={[t("freelancerPoint1"), t("freelancerPoint2")]}
          selected={kind === "freelancer"}
          onSelect={() => setKind("freelancer")}
        />
        <KindCard
          art={<BureauArt />}
          title={t("bureauTitle")}
          body={t("bureauBody")}
          points={[t("bureauPoint1"), t("bureauPoint2")]}
          selected={kind === "bureau"}
          onSelect={() => setKind("bureau")}
        />
      </div>
      {kind === "freelancer" && (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200">
          <PersonalActivation next={next} />
        </div>
      )}
      {kind === "bureau" && (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200">
          <BureauForm next={next} />
        </div>
      )}
    </div>
  );
}

export function AccountChooser({
  options,
  next,
  otherAccountHref,
}: {
  options: LoginOptions;
  next: string;
  /** Where "use a different account" goes; null for this app's own login page. */
  otherAccountHref: string | null;
}) {
  const t = useTranslations("auth.choose");
  const tr = useTranslations("enums.role");
  const locale = useLocale();
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    selectAccountAction,
    {},
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const [askingConsent, setAskingConsent] = useState(false);

  // Nothing yet anywhere: the registration view, two cards side by side.
  const isNew = !options.personal_exists && options.organizations.length === 0;

  const role = (value: string) => (tr.has(value) ? tr(value) : value);

  const otherAccount = (
    <Button variant="outline" size="sm" className="w-full" asChild>
      {otherAccountHref ? (
        // A plain link: the route handler answers with a redirect off-site.
        <a href={otherAccountHref}>
          <ArrowLeft /> {t("otherAccount")}
        </a>
      ) : (
        <Link href="/login">
          <ArrowLeft /> {t("otherAccount")}
        </Link>
      )}
    </Button>
  );

  if (isNew) {
    return (
      <div className="space-y-4">
        <NewAccount next={next} />
        {otherAccount}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next} />

        {state.error && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            {t("personalHeading")}
          </p>
          {options.personal_exists ? (
            <Choice
              id="personal"
              name="personal"
              value="1"
              icon={<UserRound className="size-4" />}
              title={t("personal")}
              subtitle={t("personalActive")}
              chosen={chosen}
              onChoose={setChosen}
            />
          ) : (
            // Not enabled yet: picking it asks the consent question first.
            <button
              type="button"
              aria-expanded={askingConsent}
              onClick={() => setAskingConsent((open) => !open)}
              className={cn(
                "border-border hover:border-suliko-default-color hover:bg-suliko-default-color/5",
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              )}
            >
              <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-full">
                <UserRound className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{t("personal")}</span>
                  <span className="bg-status-warning/15 text-status-warning rounded-full px-2 py-0.5 text-xs font-semibold uppercase">
                    {t("inactive")}
                  </span>
                </span>
                <span className="text-muted-foreground block text-xs">
                  {t("personalInactiveHint")}
                </span>
              </span>
              <ChevronRight
                className={cn(
                  "text-muted-foreground size-4 transition-transform",
                  askingConsent && "rotate-90",
                )}
                aria-hidden
              />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            {t("organizations")}
          </p>
          {options.organizations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("noOrganizations")}
            </p>
          ) : (
            options.organizations.map((org) => (
              <Choice
                key={org.tenant_slug}
                id={org.tenant_slug}
                name="tenant_slug"
                value={org.tenant_slug}
                icon={<Building2 className="size-4" />}
                title={org.tenant_name}
                subtitle={role(org.role)}
                chosen={chosen}
                onChoose={setChosen}
              />
            ))
          )}
        </div>
      </form>

      {askingConsent && !options.personal_exists && (
        <PersonalActivation next={next} />
      )}

      <CreateBureau next={next} />

      {otherAccount}
    </div>
  );
}
