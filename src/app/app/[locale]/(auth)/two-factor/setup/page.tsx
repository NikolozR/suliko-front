// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirectTo } from "@office/i18n/navigation";
import { safeNextPath } from "@office/shared/auth/next-path";
import { getSession } from "@office/shared/auth/session";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

import { SetupPanel } from "./setup-panel";

export const generateMetadata = pageTitle("twoFactorSetup");

/**
 * Where a privileged account without a second factor is held at sign-in, when
 * the API requires one (`MFA_REQUIRE_ENROLMENT`).
 *
 * Before this existed the only instruction such a user got was to run a
 * command on the server — a dead end for every customer, which is why the
 * requirement could never be switched on.
 */
export default async function TwoFactorSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.mfa");

  const query = await searchParams;
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const next = safeNextPath(rawNext) ?? "/dashboard";

  const session = await getSession();
  if (!session) redirectTo("/login", locale);
  // A factor exists already: this is the challenge, not setup.
  if (session.hasMfa && !session.mfaSatisfied)
    redirectTo("/two-factor", locale);
  if (session.hasMfa) redirectTo(next, locale);

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">{t("setupTitle")}</h1>
        <p className="text-sm text-white/80">{t("setupSubtitle")}</p>
      </AuthCardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{t("setupIntro")}</p>
        <SetupPanel next={next} />
      </CardContent>
    </Card>
  );
}
