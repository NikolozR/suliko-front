// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

import { AcceptInviteClient } from "./accept-invite-client";

export const generateMetadata = pageTitle("acceptInvite");

/**
 * Land on an invitation from an organisation, for someone who already has an
 * account. Public in `middleware.ts`: the link is often opened on a device
 * that is not signed in. The token is spent by the client once mounted.
 */
export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.invite");

  const query = await searchParams;
  const raw = query.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <AlertTriangle className="text-status-warning size-8" aria-hidden />
          <p className="font-medium">{t("missingTitle")}</p>
          <p className="text-muted-foreground text-sm">{t("missingBody")}</p>
          <Button variant="brand" size="sm" className="w-full" asChild>
            <Link href="/login">{t("signIn")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </AuthCardHeader>
      <CardContent className="p-0">
        <AcceptInviteClient token={token} />
      </CardContent>
    </Card>
  );
}
