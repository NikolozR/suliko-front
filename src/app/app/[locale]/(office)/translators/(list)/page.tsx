// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Plus, UserPlus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { getReference } from "@office/features/calculator/api";
import { listTranslators } from "@office/features/translators/api";
import { CITY_CODES } from "@office/features/translators/cities";
import { WORK_KINDS, type WorkKind } from "@office/features/translators/work-kind";
import { TranslatorWork } from "@office/features/translators/components/translator-work";
import { DIRECTORY_PAGE_SIZE } from "@office/features/directory/types";
import { requirePermission } from "@office/shared/auth/guards";
import { Can } from "@office/shared/components/can";
import { Pagination, ResultCount } from "@office/shared/components/data/pagination";
import { SearchFilters } from "@office/shared/components/data/search-filters";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { EmptyState, NoResultsState, PastLastPageState } from "@office/shared/components/data/states";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { ClickableRow } from "@office/shared/components/data/clickable-row";
import { RowLink } from "@office/shared/components/data/row-link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";
import { tolerate } from "@office/shared/lib/tolerate";
import { cn } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";
import { PhoneLink } from "@office/shared/components/phone-link";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Portal account state — the production screen's Active / None badge. */
function AccountBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        active ? "bg-status-success text-white dark:text-neutral-950" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export const generateMetadata = pageTitle("translators");

export default async function TranslatorsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Unguarded before plans existed, when every role could read translators.
  // A freelancer's plan cannot, and the unhandled 403 crashed the screen.
  await requirePermission("translators.read", locale);
  const t = await getTranslations("nav");
  const tt = await getTranslations("translators");
  const td = await getTranslations("directory");
  const tc = await getTranslations("common");
  const tcity = await getTranslations("cities");
  const query = await searchParams;

  const search = one(query.search);
  const rawActive = one(query.is_active);
  const isActive = rawActive === "true" ? true : rawActive === "false" ? false : undefined;
  const language = one(query.language) || undefined;
  const city = one(query.city) || undefined;
  const rawWork = one(query.work);
  const work = WORK_KINDS.find((kind) => kind === rawWork) as WorkKind | undefined;
  const offset = Math.max(0, Number.parseInt(one(query.offset) ?? "0", 10) || 0);

  // The bureau's languages, for the language filter. Without them the list
  // still works, just without that filter.
  const [result, reference] = await Promise.all([
    tolerate(listTranslators({ search, isActive, language, city, work, offset, limit: DIRECTORY_PAGE_SIZE })),
    tolerate(getReference()),
  ]);
  const languages = (reference.data?.languages ?? []).map((l) => ({
    value: l.code,
    label: locale === "ka" ? l.name_ka : l.name_en,
  }));
  if (!result.data) {
    return (
      <>
        <PageHeader {...sectionMark("translators")} title={t("translators")} />
        <ApiUnavailable error={result.error} what={t("translators")} endpoints={["GET /api/v1/translators"]} />
      </>
    );
  }
  const { items, meta } = result.data;

  const hasFilters = Boolean(search || rawActive || language || city || work);
  const workLabels = {
    notary: tt("notaryTag"),
    oral: tt("oralTag"),
    oralOnly: tt("oralOnlyTag"),
    none: tt("noLanguages"),
  };

  return (
    <>
      <PageHeader
        {...sectionMark("translators")}
        title={t("translators")}
        actions={
          <Can permission="translators.write">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/translators/invite"><UserPlus /> {tt("invite")}</Link>
              </Button>
              <Button variant="brand" size="sm" asChild>
                <Link href="/translators/new"><Plus /> {tt("newTranslator")}</Link>
              </Button>
            </div>
          </Can>
        }
      />

      <Card className="overflow-hidden py-0">
        <SearchFilters
          title={tt("listTitle")}
          count={<ResultCount shown={items.length} total={meta.total} entity={tt("entity")} />}
          search={search}
          searchPlaceholder={tt("searchPlaceholder")}
          selects={[
            ...(languages.length > 0 || language
              ? [{
                  name: "language",
                  label: tt("languageFilter"),
                  value: language,
                  options: languages,
                }]
              : []),
            {
              name: "city",
              label: tt("cityFilter"),
              value: city,
              options: CITY_CODES.map((code) => ({ value: code, label: tcity(code) })),
            },
            {
              name: "work",
              label: tt("work"),
              value: work,
              options: WORK_KINDS.map((kind) => ({ value: kind, label: tt(`workKind.${kind}`) })),
            },
            {
              name: "is_active",
              label: td("status"),
              value: rawActive,
              options: [
                { value: "true", label: td("active") },
                { value: "false", label: td("inactive") },
              ],
            },
          ]}
        />

        <CardContent className="p-0">
          {items.length === 0 ? (
            meta.total > 0 && offset > 0 ? (
              <PastLastPageState firstPageHref="/translators" />
            ) : hasFilters ? (
              <NoResultsState
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/translators">{tc("clearFilters")}</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                hue={sectionMark("translators").hue}
                title={tt("emptyTitle")}
                body={tt("emptyBody")}
                action={
                  <Can permission="translators.write">
                    <Button variant="brand" size="sm" asChild>
                      <Link href="/translators/new"><Plus /> {tt("newTranslator")}</Link>
                    </Button>
                  </Can>
                }
              />
            )
          ) : (
            <>
              <div className="custom_scroll">
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">{td("id")}</TableHead>
                      <TableHead>{td("name")}</TableHead>
                      <TableHead>{tt("languages")}</TableHead>
                      <TableHead>{td("phone")}</TableHead>
                      <TableHead>{td("email")}</TableHead>
                      <TableHead className="w-24">{td("account")}</TableHead>
                      <TableHead className="w-24">{td("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => (
                      <ClickableRow key={row.id} href={`/translators/${row.id}`}>
                        <TableCell data-label={td("id")} className="text-muted-foreground tabular-nums">{row.id}</TableCell>
                        <TableCell data-label={td("name")} data-full className="font-medium">
                          <RowLink
                            href={`/translators/${row.id}`}
                            title={row.name}
                            className="hover:text-link clamp-name transition-colors"
                          >
                            {row.name}
                          </RowLink>
                        </TableCell>
                        <TableCell data-label={tt("languages")}>
                          <TranslatorWork translator={row} labels={workLabels} />
                        </TableCell>
                        <TableCell data-label={td("phone")}>
                          <PhoneLink phone={row.phone} />
                        </TableCell>
                        <TableCell data-label={td("email")}>
                          {row.email
                            ? <a href={`mailto:${row.email}`} className="text-link hover:underline">{row.email}</a>
                            : <span className="text-muted-foreground">–</span>}
                        </TableCell>
                        <TableCell data-label={td("account")}>
                          <AccountBadge
                            active={row.has_portal_account}
                            label={row.has_portal_account ? td("accountActive") : td("accountNone")}
                          />
                        </TableCell>
                        <TableCell data-label={td("status")}>
                          {row.is_active
                            ? <span className="text-status-success text-xs font-medium">{td("active")}</span>
                            : <span className="text-muted-foreground text-xs">{td("inactive")}</span>}
                        </TableCell>
                      </ClickableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                total={meta.total} limit={meta.limit} offset={meta.offset}
                basePath="/translators"
                params={{ search, is_active: rawActive, language, city }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
