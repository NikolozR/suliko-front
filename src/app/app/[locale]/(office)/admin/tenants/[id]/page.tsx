// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  getClaudeWorkerStatus,
  getTenant,
  getTenantBilling,
  listBillingPackages,
} from "@office/features/platform/api";
import { ClaudeTranslateControl } from "@office/features/platform/components/claude-translate-control";
import { FreeMonthCheck } from "@office/features/platform/components/free-month-control";
import { TenantPackageControl } from "@office/features/platform/components/tenant-package-control";
import { TenantMonths } from "@office/features/platform/components/tenant-months";
import { TenantStatusBadge } from "@office/features/platform/components/tenant-status-badge";
import { TenantStatusControl } from "@office/features/platform/components/tenant-status-control";
import { RoleBadge } from "@office/features/users/components/role-badge";
import { requireAdmin } from "@office/shared/auth/guards";
import { PLAN_LABELS } from "@office/shared/auth/plans";
import { BackLink } from "@office/shared/components/back-link";
import { Detail, DetailList } from "@office/shared/components/detail-list";
import { PageHeader } from "@office/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { monthLabel } from "@office/features/billing/lib";
import { sectionMark } from "@office/shared/config/navigation";
import { formatDate, formatDateTime } from "@office/shared/lib/dates";
import { formatMoneyString, parseTetri, tetriToString } from "@office/shared/lib/money";
import { ApiError } from "@office/shared/lib/api";
import { tolerate } from "@office/shared/lib/tolerate";
import { formatFileSize } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("tenant");

/**
 * One bureau, seen from outside it.
 *
 * Read-heavy on purpose. A platform operator's job here is to understand what
 * a customer has and to unblock them — not to run their business for them, so
 * there is no editing of their orders, clients or pricing. The two actions
 * that exist (suspend, and create an account) are the two a bureau cannot
 * perform for itself when something has gone wrong.
 */
export default async function PlatformTenantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!/^\d{1,10}$/.test(id)) notFound();
  const tenantId = Number(id);
  const session = await requireAdmin(locale, `/admin/tenants/${tenantId}`);
  const t = await getTranslations("platform.tenant");
  const tBilling = await getTranslations("platform.billing");
  const packages = await tolerate(listBillingPackages());
  const billing = await tolerate(getTenantBilling(tenantId));
  const claudeWorker = await tolerate(getClaudeWorkerStatus());
  const tClaude = await getTranslations("platform.claude");

  let detail;
  try {
    detail = await getTenant(tenantId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { tenant, users, languages, pricing, figures, storage } = detail;
  const isOwnTenant = tenant.id === session.tenantId;

  return (
    <>
      <PageHeader
        {...sectionMark("admin")}
        title={tenant.display_name}
        description={`${tenant.slug} · ${PLAN_LABELS[tenant.plan]}${
          tenant.onboarding_required ? t("notChosenSuffix") : ""
        }`}
        actions={<BackLink href="/admin" label={t("back")} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <DetailList columns={3}>
              <Detail label={t("handle")} value={tenant.slug} mono />
              <Detail label={t("status")}>
                <TenantStatusBadge status={tenant.status} />
              </Detail>
              <Detail label={t("plan")} value={PLAN_LABELS[tenant.plan]} />
              <Detail
                label={tBilling("package")}
                value={`${tBilling("packageValue", { tier: tenant.package_tier })} · ${tBilling(`audience.${tenant.package_audience}`)}`}
              />
              <Detail label={t("language")} value={tenant.locale.toUpperCase()} />
              <Detail label={t("joined")} value={formatDate(tenant.created_at)} />
              <Detail
                label={t("people")}
                value={t("peopleValue", { active: tenant.active_users, total: tenant.users })}
              />
            </DetailList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantStatusControl
              tenantId={tenant.id}
              status={tenant.status}
              isOwnTenant={isOwnTenant}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">{tClaude("title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{tClaude("body")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClaudeTranslateControl tenantId={tenant.id} enabled={tenant.claude_translate} />
          {claudeWorker.data && (
            <p className="border-t pt-4 text-sm">
              <span
                className={
                  claudeWorker.data.online ? "text-status-success font-medium" : "text-hue-red-ink font-medium"
                }
              >
                {claudeWorker.data.online ? tClaude("workerOnline") : tClaude("workerOffline")}
              </span>
              <span className="text-muted-foreground">
                {" · "}
                {claudeWorker.data.last_seen
                  ? tClaude("lastSeen", { time: formatDateTime(claudeWorker.data.last_seen) })
                  : tClaude("neverSeen")}
                {" · "}
                {tClaude("queue", {
                  queued: claudeWorker.data.queued,
                  translating: claudeWorker.data.translating,
                })}
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {packages.data && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">{tBilling("tenantTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {billing.data && (
              <div className="space-y-4">
                <DetailList columns={3}>
                  <Detail
                    label={tBilling("billingSince")}
                    value={formatDate(billing.data.billing_started)}
                  />
                  <Detail
                    label={tBilling("billingStart")}
                    value={formatDate(billing.data.period_start)}
                  />
                  <Detail
                    label={tBilling("billingEnd")}
                    value={formatDate(billing.data.period_end)}
                  />
                </DetailList>
                <p className="text-muted-foreground text-xs">
                  {tBilling("billingPeriodNote", {
                    month: monthLabel(billing.data.period, locale),
                  })}
                </p>
                <FreeMonthCheck
                  tenantId={tenant.id}
                  period={billing.data.period}
                  free={billing.data.free_this_month}
                />
              </div>
            )}
            <div className={billing.data ? "border-t pt-5" : undefined}>
              <TenantPackageControl
                tenantId={tenant.id}
                tier={tenant.package_tier}
                packages={packages.data.filter((p) => p.audience === tenant.package_audience)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {billing.data && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">
              {tBilling("monthsTitle")}{" "}
              <span className="text-muted-foreground font-normal">
                ({billing.data.months.length})
              </span>
            </CardTitle>
            <p className="text-muted-foreground text-sm">{tBilling("monthsBody")}</p>
          </CardHeader>
          <CardContent className="p-0">
            <TenantMonths tenantId={tenant.id} months={billing.data.months} locale={locale} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">{t("storage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailList columns={3}>
            <Detail label={t("storageFiles")} value={String(storage.files)} />
            <Detail label={t("storageSize")} value={formatFileSize(storage.bytes)} />
          </DetailList>
          <p className="text-muted-foreground text-xs">{t("storageNote")}</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">{t("figures")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList columns={3}>
            <Detail label={t("orders")} value={String(figures.orders)} />
            <Detail label={t("documents")} value={String(figures.documents)} />
            <Detail label={t("pages")} value={String(figures.pages)} />
            <Detail label={t("billed")} value={formatMoneyString(figures.revenue)} />
            <Detail
              label={t("paidOut")}
              // Added in tetri: `Number("0.1") + Number("0.2")` is not 0.3.
              value={formatMoneyString(
                tetriToString(
                  (parseTetri(figures.translator_cost) ?? 0) + (parseTetri(figures.notary_cost) ?? 0),
                ),
              )}
            />
            <Detail label={t("grossProfit")} value={formatMoneyString(figures.gross_profit)} />
            <Detail
              label={t("firstOrder")}
              value={figures.first_order ? formatDate(figures.first_order) : null}
            />
            <Detail
              label={t("latestOrder")}
              value={figures.last_order ? formatDate(figures.last_order) : null}
            />
          </DetailList>
          <p className="text-muted-foreground mt-4 text-xs">{t("figuresNote")}</p>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("pairs")}{" "}
              <span className="text-muted-foreground font-normal">({pricing.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pricing.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noPricing")}</p>
            ) : (
              <Table className="stack-mobile">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pair")}</TableHead>
                    <TableHead className="w-32 text-right">{t("perPage")}</TableHead>
                    <TableHead className="w-24">{t("active")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing.map((pair) => (
                    <TableRow key={`${pair.source_language}-${pair.target_language}`}>
                      <TableCell data-full className="font-mono text-xs uppercase">
                        {pair.source_language} → {pair.target_language}
                      </TableCell>
                      <TableCell data-label={t("perPage")} className="text-right tabular-nums">
                        {formatMoneyString(pair.price_per_page)}
                      </TableCell>
                      <TableCell data-label={t("active")} className="text-xs">
                        {pair.is_active ? (
                          <span className="text-status-success">{t("yes")}</span>
                        ) : (
                          <span className="text-muted-foreground">{t("no")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {languages.length > 0 && (
              <p className="text-muted-foreground mt-4 text-xs">
                {t("languagesOffered", {
                  list: languages.map((code) => code.toUpperCase()).join(", "),
                })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("people")}{" "}
              <span className="text-muted-foreground font-normal">({users.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="stack-mobile">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead className="w-28">{t("role")}</TableHead>
                  <TableHead className="w-24">{t("userStatus")}</TableHead>
                  <TableHead className="w-36">{t("lastSeen")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell data-full>
                      <span className="block font-medium">{user.full_name}</span>
                      <span className="text-muted-foreground block text-xs break-all">
                        {user.email}
                      </span>
                      {user.position && (
                        <span className="text-muted-foreground block text-xs">
                          {user.position}
                        </span>
                      )}
                    </TableCell>
                    <TableCell data-label={t("role")}><RoleBadge role={user.role} plan={tenant.plan} /></TableCell>
                    <TableCell data-label={t("userStatus")} className="text-xs">
                      {!user.is_active ? (
                        <span className="text-muted-foreground">{t("disabled")}</span>
                      ) : user.must_change_password ? (
                        <span className="text-status-warning font-medium">{t("invited")}</span>
                      ) : (
                        <span className="text-status-success font-medium">{t("userActive")}</span>
                      )}
                    </TableCell>
                    <TableCell data-label={t("lastSeen")} className="text-muted-foreground text-xs">
                      {user.last_login_at ? formatDateTime(user.last_login_at) : t("never")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
