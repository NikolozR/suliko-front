// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import {
  Building2,
  Coins,
  FileText,
  Handshake,
  Languages,
  Layers,
  ListChecks,
  Plug,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PlanChoice } from "@/app/app/[locale]/onboarding/plan-choice";
import { listOptions } from "@office/features/options/api";
import {
  getGeneral,
  listDocumentTypes,
  listLanguages,
  listPricing,
} from "@office/features/settings/api";
import {
  getInvoiceReadiness,
  listCompanies,
} from "@office/features/settings/companies";
import { CompaniesTab } from "@office/features/settings/components/companies-tab";
import { InvoiceTemplateCard } from "@office/features/settings/components/invoice-template-card";
import { getInvoiceTemplate } from "@office/features/settings/invoice-template";
import { DocumentTypesTab } from "@office/features/settings/components/document-types-tab";
import { GeneralForm } from "@office/features/settings/components/general-form";
import { IntegrationsTab } from "@office/features/settings/components/integrations-tab";
import { LanguagesTab } from "@office/features/settings/components/languages-tab";
import { ListsTab } from "@office/features/settings/components/lists-tab";
import { OrdersTab } from "@office/features/settings/components/orders-tab";
import { PricingTab } from "@office/features/settings/components/pricing-tab";
import { ImportWizard } from "@office/features/imports/components/import-wizard";
import { listImports } from "@office/features/imports/api";
import { listIntegrations } from "@office/features/settings/integrations";
import { visibleIntegrations } from "@office/features/settings/integration-visibility";
import { requirePermission } from "@office/shared/auth/guards";
import {
  ApiUnavailable,
  ApiUnavailableInline,
} from "@office/shared/components/data/api-unavailable";
import { PageHeader } from "@office/shared/components/page-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@office/shared/components/ui/tabs";
import { UrlTabs } from "@office/shared/components/url-tabs";
import { sectionMark } from "@office/shared/config/navigation";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";
import { Link } from "@office/i18n/navigation";
import { Button } from "@office/shared/components/ui/button";

const TABS = [
  "general",
  "plan",
  "documentTypes",
  "languages",
  "pricing",
  "orders",
  "lists",
  "companies",
  "import",
  "integrations",
] as const;
type Tab = (typeof TABS)[number];

/** `?tab=` values as links write them ("document-types") and as keys. */
const ALIASES: Record<string, Tab> = {
  "document-types": "documentTypes",
  documenttypes: "documentTypes",
};

export const generateMetadata = pageTitle("settings");

/**
 * Settings — the organisation, its plan, pricing and reference data.
 *
 * Every read is tolerated separately. Settings is the screen people open when
 * something is already wrong, and a single failing endpoint taking the whole
 * route down is the worst possible answer to "why is pricing broken". A tab
 * whose data is missing says so; the others still work.
 *
 * The open tab is in the URL (`?tab=pricing`), so "Settings → Pricing" links
 * from the order form and the invoice actually land there.
 */
export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("settings.manage", locale);
  const t = await getTranslations("settings");
  const tOnboarding = await getTranslations("onboarding");

  const query = await searchParams;
  const rawTab =
    (Array.isArray(query.tab) ? query.tab[0] : query.tab) ?? "general";
  const requested = ALIASES[rawTab.toLowerCase()] ?? rawTab;
  const canManagePlan = session.permissions.includes("tenant.manage");
  // A bureau stays a bureau and the personal account stays Freelancer
  // (`bureau_stays_bureau` / `personal_stays_freelancer` in api/v1/tenant.py):
  // for both the tab only says what the plan is.
  const onPersonal =
    !!session.personal && session.personal.tenant_slug === session.tenantSlug;
  const bureauLocked =
    !onPersonal && !session.onboardingRequired && session.plan === "bureau";
  // The bureau-orders question is only asked of a freelancer's own workspace
  // (the API refuses it anywhere else).
  const tab: Tab =
    (TABS as readonly string[]).includes(requested) &&
    (requested !== "plan" || canManagePlan) &&
    (requested !== "orders" || onPersonal)
      ? (requested as Tab)
      : "general";
  // A freelancer is not a company, but invoices still need a seller: the tab
  // stays, worded as their own details.
  const freelancerPlan = session.plan === "freelancer";

  const [
    generalR,
    documentTypesR,
    languagesR,
    pricingR,
    integrationsR,
    companiesR,
    readinessR,
    statusOptionsR,
    sourceOptionsR,
    importsR,
    templateR,
  ] = await Promise.all([
    tolerate(getGeneral()),
    tolerate(listDocumentTypes()),
    tolerate(listLanguages()),
    tolerate(listPricing()),
    tolerate(listIntegrations()),
    tolerate(listCompanies()),
    tolerate(getInvoiceReadiness()),
    tolerate(listOptions("order_status")),
    tolerate(listOptions("acquisition_source")),
    // Only fetched for the tab that shows it.
    tab === "import"
      ? tolerate(listImports())
      : Promise.resolve({ data: [], error: null }),
    // Only fetched for the tab that shows it.
    tab === "companies"
      ? tolerate(getInvoiceTemplate())
      : Promise.resolve({ data: null, error: null }),
  ]);

  const general = generalR.data;
  // An Integrations tab with nothing to connect was an empty page (audit
  // F24). Shown when there is something, or when the list failed to load.
  const showIntegrations =
    Boolean(integrationsR.error) ||
    visibleIntegrations(integrationsR.data ?? []).length > 0;
  const openTab = tab === "integrations" && !showIntegrations ? "general" : tab;

  return (
    <>
      <PageHeader
        {...sectionMark("settings")}
        title={t("title")}
        description={t("description")}
      />

      <UrlTabs value={openTab}>
        {/* One scrolling line instead of a wrapping block: nine tabs fit nowhere
            else, and the second row used to orphan "Integrations". */}
        <TabsList
          variant="line"
          className="h-auto! w-full justify-start gap-0.5 overflow-x-auto border-b p-0 scroll-fade-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <TabsTrigger value="general">
            <SlidersHorizontal /> {t("tabs.general")}
          </TabsTrigger>
          {canManagePlan && (
            <TabsTrigger value="plan">
              <Layers /> {t("tabs.plan")}
            </TabsTrigger>
          )}
          <TabsTrigger value="documentTypes">
            <FileText /> {t("tabs.documentTypes")}
          </TabsTrigger>
          <TabsTrigger value="languages">
            <Languages /> {t("tabs.languages")}
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <Coins /> {t("tabs.pricing")}
          </TabsTrigger>
          {onPersonal && (
            <TabsTrigger value="orders">
              <Handshake /> {t("tabs.orders")}
            </TabsTrigger>
          )}
          <TabsTrigger value="lists">
            <ListChecks /> {t("tabs.lists")}
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building2 />{" "}
            {t(freelancerPlan ? "tabs.invoiceDetails" : "tabs.companies")}
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload /> {t("tabs.import")}
          </TabsTrigger>
          {showIntegrations && (
            <TabsTrigger value="integrations">
              <Plug /> {t("tabs.integrations")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          {general ? (
            <GeneralForm
              general={general}
              section="organisation"
              languages={languagesR.data ?? []}
            />
          ) : (
            <ApiUnavailable
              error={generalR.error}
              what={t("unavailable.general")}
              endpoints={["GET /api/v1/settings/general"]}
            />
          )}
        </TabsContent>

        {canManagePlan && (
          <TabsContent value="plan" className="mt-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="font-medium">
                  {session.onboardingRequired
                    ? t("plan.notChosen")
                    : t("plan.current", {
                        plan: tOnboarding(`plans.${session.plan}.name`),
                      })}
                </p>
                {onPersonal ? (
                  <>
                    <p className="text-muted-foreground text-sm">
                      {t("plan.personalLocked")}
                    </p>
                    {/* The way up from a personal account is a bureau of its
                        own; say where to make one instead of only that it
                        cannot change here (audit F24). */}
                    <Button variant="brand" size="sm" asChild>
                      <Link href="/choose-account">
                        {t("plan.createBureau")}
                      </Link>
                    </Button>
                  </>
                ) : bureauLocked ? (
                  <p className="text-muted-foreground text-sm">
                    {t("plan.bureauLocked")}
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">
                      {t("plan.intro")}
                    </p>
                    <PlanChoice
                      current={
                        session.onboardingRequired ? undefined : session.plan
                      }
                      next="/settings?tab=plan"
                      submitLabel={t("plan.change")}
                      note={t("plan.bureauIsFinal")}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="documentTypes" className="mt-4">
          {documentTypesR.error && (
            <div className="mb-3">
              <ApiUnavailableInline
                error={documentTypesR.error}
                what={t("unavailable.documentTypes")}
              />
            </div>
          )}
          <DocumentTypesTab types={documentTypesR.data ?? []} />
        </TabsContent>

        <TabsContent value="languages" className="mt-4">
          {languagesR.error && (
            <div className="mb-3">
              <ApiUnavailableInline
                error={languagesR.error}
                what={t("unavailable.languages")}
              />
            </div>
          )}
          <LanguagesTab languages={languagesR.data ?? []} />
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          {pricingR.error && (
            <div className="mb-3">
              <ApiUnavailableInline
                error={pricingR.error}
                what={t("unavailable.pricing")}
              />
            </div>
          )}
          {/* Everything about a price in one place: speeds, due days, the
              courier fee and the translator's share, then the rates per
              language pair. With no rate yet the rates come first: they are
              the one thing a new account has to fill in, and the dashboard
              sends it here for exactly that. */}
          <div className="flex flex-col gap-4">
            {general && (
              <div
                className={
                  (pricingR.data ?? []).length === 0 ? "order-2" : "order-1"
                }
              >
                <GeneralForm general={general} section="pricing" />
              </div>
            )}
            {/* Languages feed the pair dropdowns, so a rate can never name a
                language the bureau does not have. */}
            <div
              className={
                (pricingR.data ?? []).length === 0 ? "order-1" : "order-2"
              }
            >
              <PricingTab
                pairs={pricingR.data ?? []}
                languages={languagesR.data ?? []}
              />
            </div>
          </div>
        </TabsContent>

        {onPersonal && (
          <TabsContent value="orders" className="mt-4">
            {(generalR.error ?? pricingR.error) && (
              <div className="mb-3">
                <ApiUnavailableInline
                  error={(generalR.error ?? pricingR.error)!}
                  what={t("unavailable.orders")}
                />
              </div>
            )}
            {general && (
              <OrdersTab
                accepts={general.accepts_bureau_orders ?? null}
                pairs={pricingR.data ?? []}
                languages={languagesR.data ?? []}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="lists" className="mt-4">
          {(statusOptionsR.error ?? sourceOptionsR.error) && (
            <div className="mb-3">
              <ApiUnavailableInline
                error={(statusOptionsR.error ?? sourceOptionsR.error)!}
                what={t("unavailable.lists")}
              />
            </div>
          )}
          <ListsTab
            statuses={statusOptionsR.data ?? []}
            sources={sourceOptionsR.data ?? []}
          />
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          {companiesR.error ? (
            <ApiUnavailable
              error={companiesR.error}
              what={t("unavailable.companies")}
              endpoints={["GET /api/v1/companies"]}
            />
          ) : (
            <CompaniesTab
              companies={companiesR.data ?? []}
              readiness={readinessR.data}
              personal={freelancerPlan}
            />
          )}
          {templateR.data && <InvoiceTemplateCard initial={templateR.data} />}
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          {importsR.error && (
            <div className="mb-3">
              <ApiUnavailableInline
                error={importsR.error}
                what={t("unavailable.imports")}
              />
            </div>
          )}
          <ImportWizard history={importsR.data ?? []} />
        </TabsContent>

        {showIntegrations && (
          <TabsContent value="integrations" className="mt-4 space-y-4">
            {integrationsR.error ? (
              <ApiUnavailable
                error={integrationsR.error}
                what={t("unavailable.integrations")}
                endpoints={["GET /api/v1/integrations"]}
              />
            ) : (
              <IntegrationsTab integrations={integrationsR.data ?? []} />
            )}
          </TabsContent>
        )}
      </UrlTabs>
    </>
  );
}
