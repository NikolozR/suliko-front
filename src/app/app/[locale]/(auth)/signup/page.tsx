// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { redirectTo } from "@office/i18n/navigation";
import { getSession } from "@office/shared/auth/session";
import { ssoEnabled, ssoStartPath } from "@office/shared/auth/sso";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

import { SignupForm } from "./signup-form";

export const generateMetadata = pageTitle("signup");

/**
 * Create a bureau.
 *
 * Closed for now (2026-09-30): people join by invitation, and open their own
 * personal account from the sign-in chooser. Kept behind `SIGNUP_ENABLED`,
 * which must agree with the API's setting of the same name.
 */
export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // One account for Suliko and Office, made on suliko.ge. Back here, the
  // chooser offers to create a bureau or the personal account.
  if (ssoEnabled()) redirect(ssoStartPath(locale, null, { register: true }));
  if (process.env.SIGNUP_ENABLED !== "true") redirectTo("/login", locale);
  const t = await getTranslations("auth");

  // Already signed in. Sending them to onboarding rather than the dashboard:
  // if they have not chosen a plan the shell would bounce them there anyway.
  const session = await getSession();
  if (session?.mfaSatisfied) {
    redirectTo(
      session.onboardingRequired ? "/onboarding" : "/dashboard",
      locale,
    );
  }

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">{t("signupTitle")}</h1>
        <p className="text-sm text-white/80">{t("signupSubtitle")}</p>
      </AuthCardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
