// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

import { ResetPasswordForm } from "./reset-password-form";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle("resetPassword");

/**
 * Land on a reset link and choose a new password.
 *
 * Public — `middleware.ts` already lists `/reset-password` in PUBLIC_PATHS.
 *
 * The token is NOT validated here. Checking it on page load would spend it:
 * `consume()` is single-use by design, so a preflight check would burn the
 * link and the form would then fail. It is spent once, on submit.
 *
 * No session check either. Someone can legitimately arrive here signed in as
 * a different user, and the reset stands on the token alone.
 */
export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const query = await searchParams;
  const one = (key: string) => {
    const value = query[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const token = one("token");
  // An invitation is the same single-use link, sent to someone who has never
  // had a password here. Same form, words that fit the moment.
  const isInvite = one("invite") === "1";
  const org = one("org").toLowerCase();

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <AlertTriangle className="text-status-warning size-8" aria-hidden />
          <p className="font-medium">{t("resetLinkInvalidTitle")}</p>
          <p className="text-muted-foreground text-sm">
            {isInvite ? t("inviteLinkInvalidBody") : t("resetLinkInvalidBody")}
          </p>
          <Button variant="brand" size="sm" className="w-full" asChild>
            <Link href="/forgot-password?local=1">{t("requestNewLink")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">
          {isInvite ? t("inviteTitle") : t("resetTitle")}
        </h1>
        <p className="text-sm text-white/80">
          {isInvite ? t("inviteSubtitle") : t("resetSubtitle")}
        </p>
      </AuthCardHeader>
      <CardContent>
        <ResetPasswordForm token={token} isInvite={isInvite} org={org} />
      </CardContent>
    </Card>
  );
}
