// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirectTo } from "@office/i18n/navigation";
import type { LoginOptions } from "@office/shared/auth/actions";
import { getLoginTicket } from "@office/shared/auth/cookies";
import { safeNextPath } from "@office/shared/auth/next-path";
import { ssoEnabled, ssoStartHref } from "@office/shared/auth/sso";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { api, ApiError } from "@office/shared/lib/api";
import { pageTitle } from "@office/shared/lib/page-title";

import { AccountChooser } from "./account-chooser";

export const generateMetadata = pageTitle("chooseAccount");

/**
 * Sign-in, step two: which organisation — or the personal account?
 *
 * Public in `middleware.ts`: there is a login ticket here (its own cookie),
 * not a session. The list is fetched again rather than carried from step one,
 * so a reload shows the current memberships, not the ones at sign-in.
 */
export default async function ChooseAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.choose");

  const query = await searchParams;
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const next = safeNextPath(rawNext) ?? "";

  const ticket = await getLoginTicket();
  if (!ticket) redirectTo("/login", locale);

  let options: LoginOptions | null = null;
  try {
    options = await api<LoginOptions>("/api/v1/auth/login/options", {
      method: "POST",
      authenticated: false,
      body: { ticket },
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  // Outside the try: a redirect is thrown, and must not be caught as an error.
  if (!options) redirectTo("/login?expired=1", locale);

  // Nothing to choose from yet: this is the registration, not a sign-in.
  const isNew = !options.personal_exists && options.organizations.length === 0;

  return (
    <Card className={isNew ? "w-full max-w-2xl" : "w-full max-w-md"}>
      <AuthCardHeader>
        {isNew ? (
          // Registering: a step marker and who is registering, no "where to?".
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/70">{t("stepOne")}</p>
            <h1 className="text-lg font-semibold">{t("registeringLabel")}</h1>
            <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              {options.login}
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-white/80">
              {t("signedInAs", { login: options.login })}
            </p>
          </>
        )}
      </AuthCardHeader>
      <CardContent>
        <AccountChooser
          options={options}
          next={next}
          // Through suliko.ge, "a different account" means its sign-in form:
          // plain /login would hop through suliko.ge and come back as the
          // same person.
          otherAccountHref={
            ssoEnabled()
              ? ssoStartHref(locale, next || null, { forceSignIn: true })
              : null
          }
        />
      </CardContent>
    </Card>
  );
}
