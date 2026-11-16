import "server-only";

import { ChevronRight } from "lucide-react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import { LeaveForm } from "@/app/app/[locale]/(office)/account/leave-form";
import { DeleteAccountForm } from "@/app/app/[locale]/(office)/account/delete-form";
import { MfaCard, type MfaStatus } from "@office/features/account/components/mfa-card";
import { pickMessages } from "@office/i18n/client-messages";
import { getSession } from "@office/shared/auth/session";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { api } from "@office/shared/lib/api";
import { tolerate } from "@office/shared/lib/tolerate";

import { officeLocaleOf } from "./workspace";

/** What Office's pieces on this section read (they are Office components). */
const NAMESPACES = ["account", "common", "confirm", "enums", "errors", "flash", "forms", "states", "auth"];

/**
 * The part of the one Account that is Office's: two-factor sign-in, leaving
 * the organisation, and asking for the whole account to be deleted. Shown in
 * Profile's Security tab to someone signed in to Office. Null for anyone else.
 */
export async function OfficeAccountSection({ locale }: { locale: string }) {
  if (!process.env.OFFICE_API_BASE_URL) return null;
  const session = await getSession().catch(() => null);
  if (!session || !session.mfaSatisfied) return null;

  const officeLocale = officeLocaleOf(locale);
  const all = (await import(`../../office/messages/${officeLocale}.json`)).default as AbstractIntlMessages;
  const messages = pickMessages(all, NAMESPACES);
  const t = (all.auth ?? {}) as Record<string, string>;

  const mfa = session.mfaEnforced
    ? await tolerate(
        api<{ enabled: boolean; recovery_codes_remaining: number; can_disable: boolean }>("/api/v1/auth/mfa/status"),
      )
    : null;
  const mfaStatus: MfaStatus | null = mfa?.data
    ? {
        enabled: mfa.data.enabled,
        recoveryCodesRemaining: mfa.data.recovery_codes_remaining,
        canDisable: mfa.data.can_disable,
      }
    : null;

  const askPassword = !session.passwordManaged;

  return (
    <NextIntlClientProvider locale={officeLocale} messages={messages}>
      <section className="space-y-6" aria-labelledby="office-account-title">
        <h2 id="office-account-title" className="text-lg font-semibold">
          Suliko Office
        </h2>
        {mfaStatus && <MfaCard status={mfaStatus} />}
        <details className="group space-y-4">
          <summary className="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer list-none items-center gap-2 text-sm font-medium">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
            {t.dangerTitle}
          </summary>
        <Card className="border-destructive/30">
          <CardContent className="space-y-4 pt-6">
            <div>
              <h3 className="text-destructive font-semibold">{t.leaveTitle}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{t.leaveBody}</p>
            </div>
            <LeaveForm confirmWord={session.username} askPassword={askPassword} />
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <h3 className="text-destructive font-semibold">{t.deleteTitle}</h3>
              <p className="text-muted-foreground text-sm">{t.deleteBody}</p>
              <p className="text-muted-foreground text-sm">{t.deleteBodyMore}</p>
            </div>
            <DeleteAccountForm confirmWord={session.username} askPassword={askPassword} />
          </CardContent>
        </Card>
        </details>
      </section>
    </NextIntlClientProvider>
  );
}
