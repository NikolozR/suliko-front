// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import {
  CLIENTS_PAGE_SIZE,
  listClients,
  type ClientListParams,
  type ClientType,
} from "@office/features/clients/api";
import { ClientsTable } from "@office/features/clients/components/clients-table";
import { requirePermission } from "@office/shared/auth/guards";
import { Can } from "@office/shared/components/can";
import { ExportButton } from "@office/shared/components/data/export-button";
import { Pagination, ResultCount } from "@office/shared/components/data/pagination";
import { SearchFilters } from "@office/shared/components/data/search-filters";
import { EmptyState, NoResultsState, PastLastPageState } from "@office/shared/components/data/states";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";
import { pageTitle } from "@office/shared/lib/page-title";

/**
 * Clients list.
 *
 * The reference implementation for every other list screen — translators,
 * notaries, orders and the rest follow this shape.
 *
 * Everything here is a Server Component except the filter bar. The data is
 * fetched on the server with the session's bearer token attached, so no API
 * credentials and no un-filtered rows ever reach the browser.
 */

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** First value only — `?search=a&search=b` should not become an array. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const generateMetadata = pageTitle("clients");

export default async function ClientsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Without `clients.read` the list call is a 403, which used to take the
  // whole page down to the error boundary.
  const session = await requirePermission("clients.read", locale);

  const t = await getTranslations("nav");
  const tc = await getTranslations("clients");
  const tCommon = await getTranslations("common");
  const te = await getTranslations("enums.clientType");
  const query = await searchParams;

  const search = one(query.search);
  const rawType = one(query.client_type);
  // Never pass an unvalidated value through to the API. Anything other than
  // the two known types is dropped rather than forwarded for the API to reject.
  const clientType: ClientType | undefined =
    rawType === "B2B" || rawType === "B2C" ? rawType : undefined;

  const offset = Math.max(0, Number.parseInt(one(query.offset) ?? "0", 10) || 0);

  const listParams: ClientListParams = {
    search,
    clientType,
    offset,
    limit: CLIENTS_PAGE_SIZE,
  };

  // Errors bubble to error.tsx in this segment. Catching them here would mean
  // rendering a broken page that looks like an empty one.
  const { items, meta } = await listClients(listParams);

  const hasFilters = Boolean(search || clientType);

  return (
    <>
      <PageHeader
        {...sectionMark("clients")}
        title={t("clients")}
        actions={
          <div className="flex gap-2">
            <ExportButton resource="clients" params={{ search, client_type: clientType }} />
            <Can permission="clients.write">
              <Button variant="brand" size="sm" asChild>
                <Link href="/clients/new">
                  <Plus /> {tc("newClient")}
                </Link>
              </Button>
            </Can>
          </div>
        }
      />

      <Card className="overflow-hidden py-0">
        {/* The API caps `search` at 255 characters, and so does the box. */}
        <SearchFilters
          title={tc("listTitle")}
          count={<ResultCount shown={items.length} total={meta.total} entity={tc("entity")} />}
          search={search}
          searchPlaceholder={tc("searchPlaceholder")}
          segments={[
            {
              name: "client_type",
              label: tc("clientType"),
              value: clientType,
              // The pills' own short names, spelled out on hover.
              options: [
                { value: "B2B", label: "B2B", title: te("B2B") },
                { value: "B2C", label: "B2C", title: te("B2C") },
              ],
            },
          ]}
        />

        <CardContent className="p-0">
          {items.length === 0 ? (
            meta.total > 0 && offset > 0 ? (
              <PastLastPageState
                firstPageHref={`/clients?${new URLSearchParams(
                  Object.entries({ search, client_type: clientType }).filter(
                    (entry): entry is [string, string] => Boolean(entry[1]),
                  ),
                )}`}
              />
            ) : hasFilters ? (
              <NoResultsState
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/clients">{tCommon("clearFilters")}</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                hue={sectionMark("clients").hue}
                title={tc("emptyTitle")}
                body={tc("emptyBody")}
                action={
                  <Can permission="clients.write">
                    <Button variant="brand" size="sm" asChild>
                      <Link href="/clients/new">
                        <Plus /> {tc("newClient")}
                      </Link>
                    </Button>
                  </Can>
                }
              />
            )
          ) : (
            <>
              <ClientsTable
                clients={items}
                canEdit={session.permissions.includes("clients.write")}
              />
              <Pagination
                total={meta.total}
                limit={meta.limit}
                offset={meta.offset}
                basePath="/clients"
                params={{ search, client_type: clientType }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
