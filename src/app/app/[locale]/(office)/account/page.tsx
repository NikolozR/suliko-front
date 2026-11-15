// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { ChevronRight, ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MfaCard, type MfaStatus } from "@office/features/account/components/mfa-card";
import { requireSession } from "@office/shared/auth/guards";
import { roleLabel } from "@office/shared/auth/plans";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Detail, DetailList } from "@office/shared/components/detail-list";
import { api } from "@office/shared/lib/api";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

import { ChangePasswordForm } from "./change-password-form";
import { DeleteAccountForm } from "./delete-form";
import { LeaveForm } from "./leave-form";

export const generateMetadata = pageTitle("account");

/**
 * Your own account.
 *
 * Gated on having a session and nothing else — every role can change their
 * own password and manage their own second factor, and requiring a permission
 * for either would lock out exactly the people with the fewest of them.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireSession(locale);
  const t = await getTranslations("auth");
  const tShell = await getTranslations("shell");
  const tAccount = await getTranslations("account");
  const tRole = await getTranslations("enums.role");

  // With two-factor switched off on the API a factor is never asked for, so
  // there is nothing here to manage and the card is left out.
  const mfa = session.mfaEnforced
    ? await tolerate(
        api<{ enabled: boolean; recovery_codes_remaining: number; can_disable: boolean }>(
          "/api/v1/auth/mfa/status",
        ),
      )
    : null;
  const mfaStatus: MfaStatus | null = mfa?.data
    ? {
        enabled: mfa.data.enabled,
        recoveryCodesRemaining: mfa.data.recovery_codes_remaining,
        canDisable: mfa.data.can_disable,
      }
    : null;

  const role = roleLabel(session.role, session.plan);
  // Server-side only (no NEXT_PUBLIC_ prefix), like every other setting here.
  const sulikoSiteUrl = (process.env.SULIKO_SITE_URL ?? "https://suliko.ge").replace(/\/$/, "");

  return (
    <>
      <PageHeader title={tShell("account")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <DetailList>
                <Detail label={tAccount("name")} value={session.fullName} />
                <Detail label={tAccount("username")} value={session.username} />
                <Detail
                  label={tAccount("email")}
                  value={session.email}
                  href={session.email ? `mailto:${session.email}` : undefined}
                />
                <Detail
                  label={tAccount("role")}
                  value={tRole.has(role.toLowerCase()) ? tRole(role.toLowerCase()) : role}
                />
                <Detail
                  label={tAccount("organisation")}
                  value={session.tenantName ?? session.tenantSlug}
                />
                <Detail label={tAccount("timezone")} value={session.timezone} />
              </DetailList>
              {/* These details are read-only here, and an empty email said
                  "–" with no way to add one (audit F39). Say where they are
                  changed: on suliko.ge for a Suliko account, by an admin for
                  an Office-only one. */}
              <div className="border-border mt-4 border-t pt-4">
                {session.passwordManaged ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-muted-foreground text-sm">{tAccount("editOnSuliko")}</p>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`${sulikoSiteUrl}/${locale}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink /> {tAccount("editOnSulikoLink")}
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{tAccount("editByAdmin")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {mfaStatus && <MfaCard status={mfaStatus} />}
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            {session.passwordManaged ? (
              // The password is suliko.ge's: nothing here could change it, so
              // say where — rather than a form the API would refuse.
              <>
                <div>
                  <h2 className="font-semibold">{t("passwordManagedTitle")}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{t("passwordManagedBody")}</p>
                </div>
                <Button asChild variant="outline">
                  <a href={`${sulikoSiteUrl}/login`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink /> {t("passwordManagedLink")}
                  </a>
                </Button>
              </>
            ) : (
              <>
                <div>
                  <h2 className="font-semibold">{t("changeTitle")}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{t("changeSubtitle")}</p>
                </div>
                <ChangePasswordForm />
              </>
            )}
          </CardContent>
        </Card>

        {/* The two irreversible actions stay out of sight until asked for. */}
        <details className="group lg:col-span-2">
          <summary className="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer list-none items-center gap-2 text-sm font-medium">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
            {t("dangerTitle")}
          </summary>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <Card className="border-destructive/30">
            <CardContent className="space-y-4 pt-6">
              <div>
                <h2 className="text-destructive font-semibold">{t("leaveTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("leaveBody")}</p>
              </div>
              <LeaveForm confirmWord={session.username} askPassword={!session.passwordManaged} />
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <h2 className="text-destructive font-semibold">{t("deleteTitle")}</h2>
                <p className="text-muted-foreground text-sm">{t("deleteBody")}</p>
                <p className="text-muted-foreground text-sm">{t("deleteBodyMore")}</p>
              </div>
              <DeleteAccountForm confirmWord={session.username} askPassword={!session.passwordManaged} />
            </CardContent>
          </Card>
          </div>
        </details>
      </div>
    </>
  );
}
