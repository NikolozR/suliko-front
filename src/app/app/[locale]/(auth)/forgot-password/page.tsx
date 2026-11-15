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

import { ForgotPasswordForm } from "./forgot-password-form";

export const generateMetadata = pageTitle("forgotPassword");

/**
 * Request a password-reset link.
 *
 * Public — `middleware.ts` already lists `/forgot-password` in PUBLIC_PATHS.
 */
export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Passwords are kept on suliko.ge, whose sign-in form resets them. Only the
  // Office-only password form (`?local=1`) still resets one here.
  if (ssoEnabled() && !(await searchParams).local) {
    redirect(ssoStartPath(locale, null, { forceSignIn: true }));
  }
  const t = await getTranslations("auth");

  // Someone who is already signed in does not need this; they want
  // /account, which can change the password without an email round trip.
  const session = await getSession();
  if (session?.mfaSatisfied) redirectTo("/account", locale);

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">{t("forgotTitle")}</h1>
        <p className="text-sm text-white/80">{t("forgotSubtitle")}</p>
      </AuthCardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
