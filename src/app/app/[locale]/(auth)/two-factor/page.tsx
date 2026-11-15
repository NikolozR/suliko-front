// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirectTo } from "@office/i18n/navigation";
import { safeNextPath } from "@office/shared/auth/next-path";
import { getSession } from "@office/shared/auth/session";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

import { TwoFactorForm } from "./two-factor-form";

export const generateMetadata = pageTitle("twoFactor");

/**
 * The second-factor challenge — at sign-in, and as STEP-UP.
 *
 * Step-up: a user with a factor must re-present a code before users,
 * settings, the plan and transfers once their last one is five minutes old.
 * The API answers such a request with `step_up_required`, and `api()` sends
 * the page here with `?step_up=1&next=<where they were>`. Nothing in the
 * frontend handled that before, so for anyone with a factor those screens
 * simply broke five minutes after signing in.
 */
export default async function TwoFactorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const query = await searchParams;
  const one = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const next = safeNextPath(one("next"));
  const stepUp = one("step_up") === "1";

  const session = await getSession();
  // No session at all — back to the password step.
  if (!session) redirectTo("/login", locale);
  // No factor to present: setup, or (step-up for someone without one) back.
  if (!session.hasMfa) {
    redirectTo(
      session.mfaSatisfied ? (next ?? "/dashboard") : "/two-factor/setup",
      locale,
    );
  }
  // Already cleared and not asked to confirm again: nothing to challenge.
  if (session.mfaSatisfied && !stepUp) redirectTo(next ?? "/dashboard", locale);

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">
          {stepUp ? t("stepUpTitle") : t("twoFactorTitle")}
        </h1>
        <p className="text-sm text-white/80">
          {stepUp ? t("stepUpSubtitle") : t("twoFactorSubtitle")}
        </p>
      </AuthCardHeader>
      <CardContent>
        {stepUp && (
          <p className="text-muted-foreground mb-4 text-sm">
            {t("stepUpBody")}
          </p>
        )}
        <TwoFactorForm
          username={session.username}
          next={next ?? ""}
          stepUp={stepUp}
        />
      </CardContent>
    </Card>
  );
}
