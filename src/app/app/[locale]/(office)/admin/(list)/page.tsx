// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Building2, FileText, Users, Wallet } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { StatCard, StatRow } from "@office/features/dashboard/components/stat-card";
import {
  getPlatformTotals,
  listDeletionRequests,
  listSuperusers,
  listTenants,
} from "@office/features/platform/api";
import { DeletionRequestsCard } from "@office/features/platform/components/deletion-requests-card";
import { RevokeSuperuserButton } from "@office/features/platform/components/revoke-superuser-button";
import { SuperuserGrantForm } from "@office/features/platform/components/superuser-grant-form";
import { TenantStatusBadge } from "@office/features/platform/components/tenant-status-badge";
import { Link } from "@office/i18n/navigation";
import { requireAdmin } from "@office/shared/auth/guards";
import { PLAN_LABELS } from "@office/shared/auth/plans";
import { ApiUnavailable, ApiUnavailableInline } from "@office/shared/components/data/api-unavailable";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { ClickableRow } from "@office/shared/components/data/clickable-row";
import { RowLink } from "@office/shared/components/data/row-link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";
import { formatDate, formatDateTime } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("platform");

/**
 * The admin console, at /admin: every bureau on the installation, and who the
 * superusers are.
 *
 * Superuser-only. `requireAdmin` brings a superuser in from whichever of
 * their organisations they are signed in to, and bounces anyone else to the
 * dashboard — the same treatment every other gated route gets, and it reveals
 * nothing about whether this area exists.
 */
export default async function PlatformPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireAdmin(locale);
  const t = await getTranslations("platform");

  // Tolerated separately: the totals and the lists are independent reads, and
  // one failing should not blank a console someone opened because something
  // is already wrong.
  const [totalsResult, tenantsResult, superusersResult, deletionResult] = await Promise.all([
    tolerate(getPlatformTotals()),
    tolerate(listTenants({ limit: 100 })),
    tolerate(listSuperusers()),
    tolerate(listDeletionRequests()),
  ]);

  const totals = totalsResult.data;
  const tenants = tenantsResult.data?.items ?? [];
  const superusers = superusersResult.data ?? [];

  return (
    <>
      <PageHeader
        {...sectionMark("admin")}
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/billing">
              <Wallet /> {t("billing.link")}
            </Link>
          </Button>
        }
      />

      {totalsResult.error ? (
        <ApiUnavailable
          error={totalsResult.error}
          what={t("totalsWhat")}
          endpoints={["GET /api/v1/platform/stats"]}
        />
      ) : totals ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("organisations")} value={String(totals.tenants)} icon={Building2}>
            <StatRow label={t("activeOrTrial")} value={String(totals.active_tenants)} />
            <StatRow
              label={t("suspended")}
              value={String(totals.suspended_tenants)}
              tone={totals.suspended_tenants > 0 ? "danger" : undefined}
            />
          </StatCard>

          <StatCard label={t("byPlan")} value={String(totals.tenants)} icon={FileText}>
            {Object.entries(PLAN_LABELS).map(([plan, label]) => (
              <StatRow key={plan} label={label} value={String(totals.by_plan[plan] ?? 0)} />
            ))}
          </StatCard>

          <StatCard label={t("people")} value={String(totals.users)} icon={Users} />

          <StatCard
            label={t("billed")}
            value={formatMoneyString(totals.revenue)}
            icon={Wallet}
          >
            <StatRow label={t("orders")} value={String(totals.orders)} />
          </StatCard>
        </div>
      ) : null}

      {/* Someone is waiting on a decision here, so it comes before the long lists. */}
      <DeletionRequestsCard
        open={deletionResult.data?.open ?? []}
        decided={deletionResult.data?.decided ?? []}
        timeZone={session.timezone}
        error={deletionResult.error}
      />

      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{t("organisations")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tenantsResult.error ? (
            <div className="p-4">
              <ApiUnavailableInline error={tenantsResult.error} what={t("listWhat")} />
            </div>
          ) : tenants.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">{t("none")}</p>
          ) : (
            <div className="custom_scroll">
              <Table className="stack-mobile">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("col.id")}</TableHead>
                    <TableHead>{t("col.organisation")}</TableHead>
                    <TableHead className="w-40">{t("col.handle")}</TableHead>
                    <TableHead className="w-28">{t("col.plan")}</TableHead>
                    <TableHead className="w-20">{t("col.package")}</TableHead>
                    <TableHead className="w-28">{t("col.status")}</TableHead>
                    <TableHead className="w-20 text-right">{t("col.people")}</TableHead>
                    <TableHead className="w-20 text-right">{t("col.orders")}</TableHead>
                    <TableHead className="w-28">{t("col.joined")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <ClickableRow key={tenant.id} href={`/admin/tenants/${tenant.id}`}>
                      <TableCell data-full className="text-muted-foreground tabular-nums">
                        {tenant.id}
                      </TableCell>
                      <TableCell data-label={t("col.organisation")} className="font-medium">
                        <RowLink
                          href={`/admin/tenants/${tenant.id}`}
                          className="hover:text-link transition-colors"
                        >
                          {tenant.display_name}
                        </RowLink>
                      </TableCell>
                      <TableCell data-label={t("col.handle")} className="text-muted-foreground font-mono text-xs">
                        {tenant.slug}
                      </TableCell>
                      <TableCell data-label={t("col.plan")} className="text-sm">
                        {PLAN_LABELS[tenant.plan]}
                        {tenant.onboarding_required && (
                          <span className="text-muted-foreground block text-xs">
                            {t("notChosen")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell data-label={t("col.package")} className="tabular-nums">
                        {tenant.package_tier}
                      </TableCell>
                      <TableCell data-label={t("col.status")}>
                        <TenantStatusBadge status={tenant.status} />
                      </TableCell>
                      <TableCell data-label={t("col.people")} className="text-right tabular-nums">
                        {tenant.active_users}
                        {tenant.active_users !== tenant.users && (
                          <span className="text-muted-foreground"> / {tenant.users}</span>
                        )}
                      </TableCell>
                      <TableCell data-label={t("col.orders")} className="text-right tabular-nums">{tenant.orders}</TableCell>
                      <TableCell data-label={t("col.joined")} className="text-muted-foreground text-xs tabular-nums">
                        {formatDate(tenant.created_at)}
                      </TableCell>
                    </ClickableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Who can open this console at all, and the one place more are let in:
          suliko.ge accounts, named by what they sign in with there. */}
      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{t("superusers.title")}</CardTitle>
          <p className="text-muted-foreground text-sm">{t("superusers.description")}</p>
        </CardHeader>
        <CardContent className="p-0">
          {superusersResult.error ? (
            <div className="p-4">
              <ApiUnavailableInline
                error={superusersResult.error}
                what={t("superusers.listWhat")}
              />
            </div>
          ) : (
            <div className="custom_scroll">
              <Table className="stack-mobile">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("superusers.col.person")}</TableHead>
                    <TableHead className="w-44">{t("superusers.col.signIn")}</TableHead>
                    <TableHead className="w-40">{t("superusers.col.lastSeen")}</TableHead>
                    <TableHead className="w-36" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {superusers.map((superuser) => (
                    <TableRow key={superuser.id}>
                      <TableCell data-full>
                        <span className="block font-medium">{superuser.full_name}</span>
                        <span className="text-muted-foreground block text-xs break-all">
                          {superuser.login}
                        </span>
                      </TableCell>
                      <TableCell data-label={t("superusers.col.signIn")} className="text-sm">
                        {superuser.signs_in_with_suliko
                          ? t("superusers.signInSuliko")
                          : t("superusers.signInOffice")}
                        {!superuser.is_active && (
                          <span className="text-muted-foreground block text-xs">
                            {t("superusers.disabled")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        data-label={t("superusers.col.lastSeen")}
                        className="text-muted-foreground text-xs"
                      >
                        {superuser.last_login_at
                          ? formatDateTime(superuser.last_login_at, session.timezone)
                          : t("superusers.never")}
                      </TableCell>
                      <TableCell data-full className="text-right">
                        {/* The API refuses removing yourself; not offering it
                            is clearer than explaining the refusal. */}
                        {superuser.id === session.userId ? (
                          <span className="text-muted-foreground text-xs">
                            {t("superusers.you")}
                          </span>
                        ) : (
                          <RevokeSuperuserButton
                            userId={superuser.id}
                            name={superuser.full_name || superuser.login}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="border-border border-t p-4">
            <SuperuserGrantForm />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
