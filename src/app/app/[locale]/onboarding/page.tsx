// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import {
  BarChart3,
  Calculator,
  FileSpreadsheet,
  HardDrive,
  Languages,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirectTo } from "@office/i18n/navigation";
import { requireSession } from "@office/shared/auth/guards";
import { pageTitle } from "@office/shared/lib/page-title";

import { PlanChoice } from "./plan-choice";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = pageTitle("onboarding");

/**
 * First run: what the product does, and which plan to be on.
 *
 * Deliberately OUTSIDE the `(app)` route group. The shell redirects here
 * whenever a plan has not been chosen, so a screen inside it would bounce to
 * itself — and a sidebar whose tabs depend on the very choice being made is
 * not something to show while making it. Its own session guard below is what
 * replaces the shell's.
 *
 * Only a sign-up lands here: a bureau created from the chooser or the
 * switcher starts on the Bureau plan, so it has nothing to choose.
 */
export default async function OnboardingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireSession(locale);
  const t = await getTranslations("onboarding");

  // Someone who has already chosen has no business here; they want the
  // upgrade path in Settings, which is a different screen.
  if (!session.onboardingRequired) redirectTo("/dashboard", locale);

  const tour = [
    { icon: Languages, key: "translations" },
    { icon: UsersRound, key: "clients" },
    { icon: Calculator, key: "calculator" },
    { icon: FileSpreadsheet, key: "invoices" },
    { icon: ShieldCheck, key: "notaries" },
    { icon: BarChart3, key: "reports" },
    { icon: HardDrive, key: "drive" },
    { icon: Wallet, key: "finances" },
  ] as const;

  return (
    <div className="bg-canvas-tint min-h-screen">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">{t("title", { name: session.fullName })}</h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </header>

        <section className="space-y-4">
          <h2 className="font-semibold">{t("tourTitle")}</h2>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {tour.map(({ icon: Icon, key }) => (
              <div key={key} className="flex gap-3">
                <Icon className="text-link mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{t(`tour.${key}.title`)}</p>
                  <p className="text-muted-foreground text-xs">{t(`tour.${key}.body`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-semibold">{t("planTitle")}</h2>
            <p className="text-muted-foreground text-sm">{t("planSubtitle")}</p>
          </div>
          <PlanChoice />
        </section>
      </div>
    </div>
  );
}
