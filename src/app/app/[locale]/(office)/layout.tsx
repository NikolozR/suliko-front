// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { getBillingUsage } from "@office/features/billing/api";
import { getUnreadCount } from "@office/features/notifications/api";
import { redirectTo } from "@office/i18n/navigation";
import { planAllows } from "@office/shared/auth/plans";
import { getSession } from "@office/shared/auth/session";
import { signInAgain } from "@office/shared/auth/guards";
import { sulikoSiteUrl } from "@office/shared/auth/sso";
import { AppShell } from "@office/shared/components/shell/app-shell";
import { FlashToast } from "@office/shared/components/shell/flash-toast";
import type { ShellUsage } from "@office/shared/components/shell/usage-banner";

/**
 * Authenticated area.
 *
 * This is the real gate. `middleware.ts` only checks that a cookie exists —
 * it cannot validate the token without an API round trip on every request.
 * Here the session is actually resolved against the API, so an expired,
 * revoked or forged token lands the user back on the login page.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  // An ended session: sign in again and come back to this page (guards.ts).
  if (!session) return signInAgain(locale);

  // Password accepted, second factor still owed. The API refuses every
  // endpoint in this state, so rendering the shell would just show a page
  // full of errors.
  if (!session.mfaSatisfied) {
    redirectTo("/two-factor", locale);
  }

  // A tenant that signed up but never chose a plan is enforced as the
  // narrower one, which would silently hide half the product. Send them to
  // onboarding first.
  //
  // `/onboarding` deliberately lives OUTSIDE this route group. Inside it, this
  // redirect would fire on the onboarding screen itself and bounce forever —
  // and the screen has no use for a sidebar whose tabs depend on the choice it
  // is asking the user to make.
  if (session.onboardingRequired) {
    redirectTo("/onboarding", locale);
  }

  // Signed in on a password somebody else chose — an invite, or an admin
  // reset. The API refuses every endpoint behind a permission until it is
  // replaced, so rendering the shell would be a sidebar of dead ends.
  // `/welcome` sits outside this group for the same reason `/onboarding` does.
  if (session.mustChangePassword) {
    redirectTo("/welcome", locale);
  }

  // The badge must never be the reason the whole app fails to render, so a
  // failure here degrades to "no badge" rather than an error page.
  // Skipped entirely on a plan without notifications: the endpoint refuses
  // it by plan, and asking anyway would burn a request per page load to
  // produce a badge the sidebar does not render.
  let unreadCount = 0;
  if (planAllows(session.plan, "notifications")) {
    try {
      unreadCount = await getUnreadCount();
    } catch {
      unreadCount = 0;
    }
  }

  // This month's orders against the account's package, for the figure in the
  // sidebar and the warning from 80 percent. Only for those who can open
  // Billing; like the badge above, it must never be the reason the page fails.
  let usage: ShellUsage | null = null;
  if (session.permissions.includes("tenant.billing")) {
    try {
      const month = await getBillingUsage();
      usage = {
        orders: month.orders,
        included: month.included,
        level: month.level,
        blocked: month.blocked,
      };
    } catch {
      usage = null;
    }
  }

  return (
    <AppShell
      permissions={session.permissions}
      plan={session.plan}
      userName={session.fullName}
      userLogin={session.login}
      tenantName={session.tenantName ?? session.tenantSlug ?? "Suliko"}
      unreadCount={unreadCount}
      usage={usage}
      timeZone={session.timezone}
      emailVerified={session.emailVerified}
      organizations={session.organizations}
      personal={session.personal}
      tenantSlug={session.tenantSlug ?? ""}
      tips={session.tips}
      translateUrl={`${sulikoSiteUrl()}/${locale}/document`}
      // What bureaus assign to a translator is shown to the person on
      // suliko.ge, under the same sign-in; nothing in Office said so. On a
      // personal account, which is a translator's own workspace, the
      // sidebar links there. A bureau's staff are not offered it.
      assignedOrdersUrl={
        session.plan === "freelancer" ? `${sulikoSiteUrl()}/${locale}/orders` : undefined
      }
    >
      {children}
      {/* Reads the address, so it needs its own boundary. */}
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </AppShell>
  );
}
