// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

import { VerifyEmailClient } from "./verify-email-client";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle("verifyEmail");

/**
 * Land on a signup confirmation link.
 *
 * Public — `middleware.ts` lists `/verify-email` in PUBLIC_PATHS, and this
 * renders whether or not the browser has a session: the link is often opened
 * on a different device from the one that is signed in.
 *
 * No session check, and the token is not pre-validated here — see
 * `VerifyEmailClient`, which spends it once the page has mounted.
 */
export default async function VerifyEmailPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const query = await searchParams;
  const raw = query.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <AlertTriangle className="text-status-warning size-8" aria-hidden />
          <p className="font-medium">{t("verifyEmailMissingTitle")}</p>
          <p className="text-muted-foreground text-sm">
            {t("verifyEmailMissingBody")}
          </p>
          <Button variant="brand" size="sm" className="w-full" asChild>
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">{t("verifyEmailTitle")}</h1>
      </AuthCardHeader>
      <CardContent className="p-0">
        <VerifyEmailClient token={token} />
      </CardContent>
    </Card>
  );
}
