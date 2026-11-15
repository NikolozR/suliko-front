// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { listNotaries } from "@office/features/notaries/api";
import { DIRECTORY_PAGE_SIZE } from "@office/features/directory/types";
import { requirePermission } from "@office/shared/auth/guards";
import { Can } from "@office/shared/components/can";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { Pagination, ResultCount } from "@office/shared/components/data/pagination";
import { SearchFilters } from "@office/shared/components/data/search-filters";
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

/**
 * Ready / No IBAN.
 *
 * The question this list exists to answer is "can I pay this notary by
 * transfer", so the badge reports exactly that rather than showing the IBAN.
 */
function BankBadge({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ready ? "bg-status-success text-white dark:text-neutral-950" : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export const generateMetadata = pageTitle("notaries");

export default async function NotariesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Without `notaries.read` the list call is a 403, which used to take the
  // whole page down to the error boundary.
  await requirePermission("notaries.read", locale);
  const t = await getTranslations("nav");
  const tn = await getTranslations("notaries");
  const td = await getTranslations("directory");
  const tc = await getTranslations("common");
  const query = await searchParams;

  const search = one(query.search);
  const offset = Math.max(0, Number.parseInt(one(query.offset) ?? "0", 10) || 0);

  const result = await tolerate(listNotaries({ search, offset, limit: DIRECTORY_PAGE_SIZE }));
  if (!result.data) {
    return (
      <>
        <PageHeader {...sectionMark("notaries")} title={t("notaries")} />
        <ApiUnavailable error={result.error} what={t("notaries")} endpoints={["GET /api/v1/notaries"]} />
      </>
    );
  }
  const { items, meta } = result.data;

  return (
    <>
      <PageHeader
        {...sectionMark("notaries")}
        title={t("notaries")}
        actions={
          <Can permission="notaries.write">
            <Button variant="brand" size="sm" asChild>
              <Link href="/notaries/new"><Plus /> {tn("newNotary")}</Link>
            </Button>
          </Can>
        }
      />

      <Card className="overflow-hidden py-0">
        <SearchFilters
          title={tn("listTitle")}
          count={<ResultCount shown={items.length} total={meta.total} entity={tn("entity")} />}
          search={search}
          searchPlaceholder={tn("searchPlaceholder")}
        />

        <CardContent className="p-0">
          {items.length === 0 ? (
            meta.total > 0 && offset > 0 ? (
              <PastLastPageState firstPageHref="/notaries" />
            ) : search ? (
              <NoResultsState
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/notaries">{tc("clearFilters")}</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                hue={sectionMark("notaries").hue}
                title={tn("emptyTitle")}
                body={tn("emptyBody")}
                action={
                  <Can permission="notaries.write">
                    <Button variant="brand" size="sm" asChild>
                      <Link href="/notaries/new"><Plus /> {tn("newNotary")}</Link>
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
                      <TableHead>{td("phone")}</TableHead>
                      <TableHead>{td("email")}</TableHead>
                      <TableHead className="w-32">{tn("registrationCol")}</TableHead>
                      <TableHead className="w-24">{td("bank")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((row) => (
                      <ClickableRow key={row.id} href={`/notaries/${row.id}`}>
                        <TableCell data-label={td("id")} className="text-muted-foreground tabular-nums">{row.id}</TableCell>
                        <TableCell data-label={td("name")} data-full className="font-medium">
                          <RowLink
                            href={`/notaries/${row.id}`}
                            title={row.name}
                            className="hover:text-link clamp-name transition-colors"
                          >
                            {row.name}
                          </RowLink>
                        </TableCell>
                        <TableCell data-label={td("phone")}>
                          <PhoneLink phone={row.phone} />
                        </TableCell>
                        <TableCell data-label={td("email")}>
                          {row.email
                            ? <a href={`mailto:${row.email}`} className="text-link hover:underline">{row.email}</a>
                            : <span className="text-muted-foreground">–</span>}
                        </TableCell>
                        <TableCell data-label={tn("registrationCol")} className="text-muted-foreground font-mono text-xs">
                          {row.registration_number ?? "–"}
                        </TableCell>
                        <TableCell data-label={td("bank")}>
                          <BankBadge
                            ready={row.bank_ready}
                            label={row.bank_ready ? td("bankReady") : td("noIban")}
                          />
                        </TableCell>
                      </ClickableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                total={meta.total} limit={meta.limit} offset={meta.offset}
                basePath="/notaries" params={{ search }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
