// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { setRequestLocale } from "next-intl/server";

import { ClientMessages } from "@office/i18n/client-messages";
import { redirectTo } from "@office/i18n/navigation";
import { getSession } from "@office/shared/auth/session";

/**
 * Pages that take the whole window: the full-screen editor.
 *
 * The same gate as the signed-in area (`(app)/layout.tsx`: the session is
 * resolved against the API, the second factor and the first steps are owed
 * first), without its shell. The editor has its own bar and wants every pixel
 * of the screen, so no sidebar.
 */
export default async function EditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) redirectTo("/login", locale);
  if (!session.mfaSatisfied) redirectTo("/two-factor", locale);
  if (session.onboardingRequired) redirectTo("/onboarding", locale);
  if (session.mustChangePassword) redirectTo("/welcome", locale);

  return (
    <ClientMessages locale={locale} extra={["files"]}>
      {children}
    </ClientMessages>
  );
}
