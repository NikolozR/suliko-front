// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@office/i18n/navigation";
import { CMS_LOCALES, LOCALE_LABELS, listStrings } from "@office/features/service-pages/api";
import { StringsGrid } from "@office/features/service-pages/components/strings-grid";
import { requirePermission } from "@office/shared/auth/guards";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { Pagination, ResultCount } from "@office/shared/components/data/pagination";
import { SearchFilters } from "@office/shared/components/data/search-filters";
import { EmptyState, NoResultsState } from "@office/shared/components/data/states";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

/**
 * Website Translations — the marketing site's i18n strings.
 *
 * The PHP app's `website_translations.php`. Separate from Service Pages
 * because the two are edited in different ways: a page is a document with a
 * title and a body, a string is a cell in a grid. Folding them into one screen
 * would give both the wrong shape.
 */

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const PAGE_SIZE = 100;

export const generateMetadata = pageTitle("websiteTranslations");

export default async function WebsiteTranslationsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requirePermission("cms.manage", locale);

  const t = await getTranslations("nav");
  const query = await searchParams;

  const search = one(query.search);
  const rawLocale = one(query.locale);
  const contentLocale = CMS_LOCALES.includes(rawLocale as (typeof CMS_LOCALES)[number])
    ? rawLocale
    : undefined;
  const group = one(query.group);
  const untranslated = one(query.untranslated) === "true";
  const offset = Math.max(0, Number.parseInt(one(query.offset) ?? "0", 10) || 0);

  const result = await tolerate(
    listStrings({
      search,
      locale: contentLocale,
      group,
      untranslated,
      limit: PAGE_SIZE,
      offset,
    }),
  );

  if (result.error) {
    return (
      <>
        <PageHeader
          title={t("websiteTranslations")}
          description="Labels and button text for the public marketing site."
        />
        <ApiUnavailable
          error={result.error}
          what="the site strings"
          endpoints={["GET /api/v1/site-strings"]}
        />
      </>
    );
  }

  const { items, meta, groups } = result.data;
  const hasFilters = Boolean(search || contentLocale || group || untranslated);

  return (
    <>
      <PageHeader
        title={t("websiteTranslations")}
        description="Labels and button text for the public marketing site. Edits publish as soon as they are saved."
      />

      <SearchFilters
        standalone
        search={search}
        searchPlaceholder="Key or value…"
        selects={[
          {
            name: "locale",
            label: "Locale",
            value: rawLocale,
            options: CMS_LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] })),
          },
          {
            name: "group",
            label: "Group",
            value: group,
            // Straight from the API, which derives them from the key prefixes,
            // so this can never offer a group that has no strings in it.
            options: groups.map((name) => ({ value: name, label: name })),
          },
          {
            name: "untranslated",
            label: "State",
            value: untranslated ? "true" : undefined,
            options: [{ value: "true", label: "Empty only" }],
          },
        ]}
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <ResultCount shown={items.length} total={meta.total} entity="strings" />
      </div>

      {items.length === 0 ? (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            {hasFilters ? (
              <NoResultsState
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/website-translations">Clear filters</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No site strings yet"
                body="Strings appear here once the marketing site registers its keys against this tenant."
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <StringsGrid strings={items} />
          <Pagination
            total={meta.total}
            limit={meta.limit}
            offset={meta.offset}
            basePath="/website-translations"
            params={{
              search,
              locale: contentLocale,
              group,
              untranslated: untranslated ? "true" : undefined,
            }}
          />
        </>
      )}

      <Card className="mt-4">
        <CardContent className="text-muted-foreground p-4 text-sm">
          <span className="text-foreground font-medium">Adding a key:</span> new keys are
          created by the marketing site, not here. This screen fills in and corrects the ones
          that already exist; a key with an empty value is one the site registered but nobody
          has written yet, and the <em>Empty only</em> filter finds them.
        </CardContent>
      </Card>
    </>
  );
}
