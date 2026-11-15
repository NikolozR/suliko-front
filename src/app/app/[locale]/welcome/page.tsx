// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { KeyRound, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChangePasswordForm } from "@office/app/[locale]/(app)/account/change-password-form";
import { groupsForPlan } from "@office/features/users/permission-catalogue";
import { redirectTo } from "@office/i18n/navigation";
import { requireSession } from "@office/shared/auth/guards";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("welcome");

/**
 * First run for an invited employee.
 *
 * Two things at once, because they belong together: what this person is
 * allowed to do here, and the password change that unlocks it. Someone who
 * has just been handed credentials by their manager deserves to know what
 * they have been given before they start.
 *
 * Deliberately OUTSIDE the `(app)` route group, for the same reason as
 * `/onboarding`: the shell redirects here whenever a password change is owed,
 * so a screen inside it would bounce to itself. It also cannot render the
 * sidebar honestly — the API refuses every endpoint behind it while the flag
 * holds, so every tab would be a dead end.
 */
export default async function WelcomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireSession(locale);

  // Nothing owed: they came here by typing the URL.
  if (!session.mustChangePassword) redirectTo("/dashboard", locale);

  const t = await getTranslations("welcome");
  const tGroup = await getTranslations("permissionGroups");
  const tPerm = await getTranslations("permissions");
  const organisation = session.tenantName ?? session.tenantSlug ?? "";

  // Their ACTUAL access — role, overrides and plan already resolved by the
  // API. Listing the role's bundle instead would promise things the plan
  // withholds.
  const held = new Set(session.permissions);
  const groups = groupsForPlan(session.plan)
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => held.has(option.permission)),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <div className="bg-canvas-tint min-h-screen">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">{t("title", { name: session.fullName })}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle", { organisation })}</p>
        </header>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="text-link mt-0.5 size-5 shrink-0"
                aria-hidden
              />
              <div>
                <h2 className="font-semibold">{t("accessTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("accessBody", { organisation: session.tenantName ?? t("yourOrganisation") })}
                </p>
              </div>
            </div>

            {groups.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noAccess")}</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {groups.map((group) => (
                  <div key={group.key} className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      {tGroup.has(group.key) ? tGroup(group.key) : group.label}
                    </p>
                    <ul className="space-y-1">
                      {group.options.map((option) => (
                        <li key={option.permission} className="text-sm">
                          {tPerm.has(`${option.permission.replace(".", "_")}.label`)
                            ? tPerm(`${option.permission.replace(".", "_")}.label`)
                            : option.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-suliko-default-color/30">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <KeyRound
                className="text-link mt-0.5 size-5 shrink-0"
                aria-hidden
              />
              <div>
                <h2 className="font-semibold">{t("passwordTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("passwordBody")}</p>
              </div>
            </div>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
