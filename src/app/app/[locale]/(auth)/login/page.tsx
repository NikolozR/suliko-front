// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { CheckCircle2, LogIn, LogOut, UserRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { redirectTo } from "@office/i18n/navigation";
import { safeNextPath } from "@office/shared/auth/next-path";
import { getSession } from "@office/shared/auth/session";
import { ssoEnabled, ssoStartHref, ssoStartPath } from "@office/shared/auth/sso";
import { Button } from "@office/shared/components/ui/button";
import { AuthCardHeader } from "@office/shared/components/brand/auth-card-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { pageTitle } from "@office/shared/lib/page-title";

import { LoginForm } from "./login-form";

export const generateMetadata = pageTitle("login");

export default async function LoginPage({
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
  // Where they were headed when the middleware sent them here. Validated:
  // only a same-site path survives, so this cannot become an open redirect.
  const next = safeNextPath(one("from") ?? one("next"));

  // Already signed in? Skip the form. A half-authenticated session goes to
  // the challenge rather than the dashboard.
  const session = await getSession();
  if (session) {
    redirectTo(
      session.mfaSatisfied ? (next ?? "/dashboard") : "/two-factor",
      locale,
    );
  }

  // Changing a password revokes every session, so both flows land back here.
  // Without this the user is bounced to a login screen with no explanation,
  // which reads as the change having failed.
  const notice = query.invited
    ? t("inviteDone")
    : query.reset
      ? t("resetDone")
      : query.changed
        ? t("changedDone")
        : query.left
          ? t("leftDone")
          : query.deletion
            ? t("deletionRequestedDone")
            : query.signed_out
              ? t("signedOut")
              : null;
  // The chooser's ten minutes ran out between the two steps, or the trip
  // through suliko.ge came back without a sign-in.
  const ssoProblem = one("sso");
  const warning = query.expired
    ? t("loginExpired")
    : ssoProblem === "expired"
      ? t("ssoExpired")
      : ssoProblem === "unavailable"
        ? t("ssoUnavailable")
        : ssoProblem === "busy"
          ? t("ssoBusy")
          : ssoProblem === "deletion"
            ? t("errors.deletionPending")
            : ssoProblem
              ? t("ssoFailed")
              : null;

  // suliko.ge is where people sign in. Someone who simply landed here (a
  // bookmark, an expired session) goes straight there and, already signed in
  // on suliko.ge, straight back without seeing a form. Anyone with something
  // to read here — a notice, a problem, having just signed out — stays, so a
  // failure can never turn into a redirect loop.
  const sso = ssoEnabled();
  // The ten minutes between suliko.ge and the chooser ran out: go round again.
  // Where suliko.ge still knows the person this finishes without a word; where
  // it does not, they see its form. The start route allows one such restart in
  // a row and then lands here with a reason.
  if (sso && query.expired && !notice && !query.password) {
    redirect(ssoStartPath(locale, next, { retry: true }));
  }
  if (sso && !notice && !warning && !query.password) {
    redirect(ssoStartPath(locale, next));
  }

  // Having just signed out is not a success to celebrate: a quiet, centred
  // goodbye, not a green banner.
  const signedOut = Boolean(query.signed_out) && !query.password;

  // Just signed out, with suliko.ge to sign back in through: one calm block,
  // a short header, one clear way back and a quieter way to switch account.
  if (signedOut && sso && !warning) {
    return (
      <Card className="w-full max-w-md">
        <AuthCardHeader>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
        </AuthCardHeader>
        <CardContent className="space-y-6 pt-2 pb-2">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <LogOut className="size-6" aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 role="status" className="text-xl font-semibold">
                {t("signedOut")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("signedOutHint")}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Button variant="brand" size="lg" className="w-full" asChild>
              <a href={ssoStartHref(locale, next)}>
                <LogIn />
                {t("signInAgain")}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
              asChild
            >
              <a href={ssoStartHref(locale, next, { forceSignIn: true })}>
                <UserRound />
                {t("signInOther")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <AuthCardHeader>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-white/80">{t("subtitle")}</p>
      </AuthCardHeader>
      <CardContent className="space-y-4">
        {notice && signedOut && (
          <div className="flex flex-col items-center gap-2 pt-2 pb-1 text-center">
            <span className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
              <LogOut className="size-5" aria-hidden />
            </span>
            <p role="status" className="text-base font-medium">
              {notice}
            </p>
          </div>
        )}
        {notice && !signedOut && (
          <div
            role="status"
            className="border-status-success/30 bg-status-success/10 flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <CheckCircle2
              className="text-status-success mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <span>{notice}</span>
          </div>
        )}
        {warning && (
          <div
            role="status"
            className="border-status-warning/30 bg-status-warning/10 rounded-md border px-3 py-2 text-sm"
          >
            {warning}
          </div>
        )}
        {sso ? (
          <>
            <div className="space-y-2">
              <Button variant="brand" size="lg" className="w-full" asChild>
                {/* A plain link: the route handler answers with a redirect off-site. */}
                <a href={ssoStartHref(locale, next)}>
                  <LogIn />
                  {t("continueWithSuliko")}
                </a>
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                {t("ssoHint")}
              </p>
              <a
                href={ssoStartHref(locale, next, { forceSignIn: true })}
                className="text-muted-foreground hover:text-foreground block pt-1 text-center text-sm underline-offset-4 transition-colors hover:underline"
              >
                {t("ssoOtherAccount")}
              </a>
            </div>
            {/* Only by address (?password=1): for the few accounts with no
                suliko.ge sign-in — platform staff — and as a way in should
                suliko.ge be down. Everyone else signs in there. */}
            {query.password && (
              <div className="border-t pt-4">
                <LoginForm next={next ?? ""} />
              </div>
            )}
          </>
        ) : (
          <LoginForm next={next ?? ""} />
        )}
      </CardContent>
    </Card>
  );
}
