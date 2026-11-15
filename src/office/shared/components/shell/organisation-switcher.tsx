"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import {
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createOrganisationAction,
  type OrgChoice,
  switchAccountAction,
} from "@office/shared/auth/actions";
import { Button } from "@office/shared/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormClass,
} from "@office/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@office/shared/components/ui/dropdown-menu";
import { Input } from "@office/shared/components/ui/input";
import { Label } from "@office/shared/components/ui/label";

/**
 * Name a new bureau and move into it as its owner — the same bureau sign-up
 * makes (plan chosen on the onboarding screen next), for an account that
 * already exists.
 */
function CreateBureauDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("shell.switcher");
  const ta = useTranslations("auth");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createOrganisationAction(name);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader icon={Building2} hue="blue">
          <DialogTitle>{t("createBureau")}</DialogTitle>
          <DialogDescription>{t("createBureauHint")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className={dialogFormClass}>
          <DialogBody className="space-y-1.5">
            <Label htmlFor="new-bureau-name">
              {ta("signupOrganisation")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-bureau-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="organization"
              required
              minLength={2}
              maxLength={255}
              autoFocus
              aria-invalid={error ? true : undefined}
            />
            <p className="text-muted-foreground text-xs">{ta("signupOrganisationHint")}</p>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {t("createBureauSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Move between the organisations this person belongs to, and their personal
 * account, without signing in again — one password covers them all. Picking
 * an inactive personal account enables it (the API emails them).
 */
export function OrganisationSwitcher({
  organizations,
  personal,
  currentSlug,
  currentName,
}: {
  organizations: OrgChoice[];
  /** Their own workspace, or null when it has not been enabled yet. */
  personal: OrgChoice | null;
  currentSlug: string;
  currentName: string;
}) {
  const t = useTranslations("shell.switcher");
  const tr = useTranslations("enums.role");
  const role = (value: string) => (tr.has(value) ? tr(value) : value);
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  const go = (target: { tenantSlug: string } | { personal: true }) =>
    startTransition(async () => {
      const result = await switchAccountAction(target);
      if (result?.error) toast.error(result.error);
    });

  const onPersonal = personal?.tenant_slug === currentSlug;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            aria-label={t("label")}
            title={t("label")}
            className="min-w-0 max-w-80 shrink gap-1.5 px-2 text-base font-semibold tracking-wide text-white hover:bg-white/15 hover:text-white"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : onPersonal ? (
              <UserRound className="size-4" />
            ) : (
              <Building2 className="size-4 opacity-80" />
            )}
            <span className="min-w-0 truncate">
              {onPersonal ? t("personal") : currentName}
            </span>
            <ChevronDown className="size-3.5 opacity-80" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            {t("organizations")}
          </DropdownMenuLabel>
          {organizations.length === 0 ? (
            <DropdownMenuItem disabled>{t("none")}</DropdownMenuItem>
          ) : (
            organizations.map((org) => {
              const current = org.tenant_slug === currentSlug;
              return (
                <DropdownMenuItem
                  key={org.tenant_slug}
                  disabled={current}
                  onSelect={() => go({ tenantSlug: org.tenant_slug })}
                >
                  <Building2 className="size-4" />
                  <span className="min-w-0 flex-1 truncate">{org.tenant_name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{role(org.role)}</span>
                  {current && <Check className="size-4" />}
                </DropdownMenuItem>
              );
            })
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={onPersonal}
            onSelect={() => {
              if (!personal && !window.confirm(t("enableConfirm"))) return;
              go({ personal: true });
            }}
          >
            <UserRound className="size-4" />
            <span className="min-w-0 flex-1 truncate">{t("personal")}</span>
            {!personal && (
              <span className="bg-status-warning/15 text-status-warning rounded-full px-2 py-0.5 text-xs font-semibold uppercase">
                {t("inactive")}
              </span>
            )}
            {onPersonal && <Check className="size-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <Plus className="size-4" />
            <span className="min-w-0 flex-1 truncate">{t("createBureau")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateBureauDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
