// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { AlertTriangle, Globe, Languages } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  CMS_LOCALES,
  LOCALE_LABELS,
  listPages,
  listStrings,
  type CmsLocale,
  type PageStatus,
} from "@office/features/service-pages/api";
import { requirePermission } from "@office/shared/auth/guards";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { NoResultsState } from "@office/shared/components/data/states";
import { PageHeader } from "@office/shared/components/page-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@office/shared/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@office/shared/components/ui/table";
import { formatDateTime } from "@office/shared/lib/dates";
import { tolerate } from "@office/shared/lib/tolerate";
import { cn } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";

function StatusPill({ status }: { status: PageStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        status === "published"
          ? "bg-status-success/15 text-status-success"
          : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function LocaleChip({ locale }: { locale: string }) {
  return (
    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs uppercase">
      {locale}
    </span>
  );
}

export const generateMetadata = pageTitle("servicePages");

export default async function ServicePagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // `cms.manage` — admin and above. This edits the public website.
  await requirePermission("cms.manage", locale);

  const t = await getTranslations("nav");

  const [pagesResult, stringsResult] = await Promise.all([
    tolerate(listPages()),
    tolerate(listStrings({ limit: 200 })),
  ]);

  // Both tables come from the same migration, so one failing means both are
  // missing — no value in a half-rendered screen here.
  const failure = pagesResult.error ?? stringsResult.error;
  if (failure || !pagesResult.data || !stringsResult.data) {
    return (
      <>
        <PageHeader
          title={t("servicePages")}
          description="Landing pages and interface text for the public marketing site."
        />
        <ApiUnavailable
          error={failure ?? { reason: "failing", detail: "The API returned no content." }}
          what="the site content"
          endpoints={["GET /api/v1/service-pages", "GET /api/v1/site-strings"]}
        />
      </>
    );
  }

  const pages = pagesResult.data;
  const strings = stringsResult.data;

  // One row per key, with a column per locale — the grid shape an editor
  // actually works in. The API returns a flat list because that is the shape
  // it stores; pivoting is a presentation decision.
  const byKey = new Map<string, { group: string; note: string | null; values: Map<string, string> }>();
  for (const row of strings.items) {
    const entry = byKey.get(row.key) ?? {
      group: row.group_name,
      note: row.context_note,
      values: new Map<string, string>(),
    };
    entry.values.set(row.locale, row.value);
    if (row.context_note) entry.note = row.context_note;
    byKey.set(row.key, entry);
  }
  const stringRows = [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b));

  const untranslated = stringRows.filter(([, entry]) =>
    CMS_LOCALES.some((code) => !entry.values.get(code)?.trim()),
  ).length;

  return (
    <>
      <PageHeader
        title={t("servicePages")}
        description="Landing pages and interface text for the public marketing site."
      />

      {(pages.missing_translations.length > 0 || untranslated > 0) && (
        <div className="border-status-warning/40 bg-status-warning/10 mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
          <AlertTriangle className="text-status-warning mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {pages.missing_translations.length > 0 && (
              <>
                <span className="font-medium">
                  {pages.missing_translations.length} page
                  {pages.missing_translations.length === 1 ? "" : "s"}
                </span>{" "}
                {pages.missing_translations.length === 1 ? "exists" : "exist"} in one language
                only:{" "}
                <span className="font-mono text-xs">
                  {pages.missing_translations.slice(0, 5).join(", ")}
                  {pages.missing_translations.length > 5 && "…"}
                </span>
                .{" "}
              </>
            )}
            {untranslated > 0 && (
              <>
                <span className="font-medium">{untranslated}</span> interface string
                {untranslated === 1 ? " is" : "s are"} missing a translation.
              </>
            )}
          </p>
        </div>
      )}

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">
            <Globe className="size-3.5" /> Service pages
          </TabsTrigger>
          <TabsTrigger value="strings">
            <Languages className="size-3.5" /> Interface text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4">
          <Card className="overflow-hidden py-0">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Pages</h2>
              <span className="text-muted-foreground text-sm tabular-nums">
                {pages.meta.total}
              </span>
            </div>
            <CardContent className="p-0">
              {pages.items.length === 0 ? (
                <NoResultsState />
              ) : (
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Order</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="w-20">Lang</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead className="w-40">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.items.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell data-full className="text-muted-foreground tabular-nums">
                            {page.sort_order}
                          </TableCell>
                          <TableCell data-label="Slug" className="font-mono text-xs">{page.slug}</TableCell>
                          <TableCell data-label="Lang">
                            <LocaleChip locale={page.locale} />
                          </TableCell>
                          <TableCell data-label="Title" className="font-medium">
                            {page.title}
                            {page.summary && (
                              <span className="text-muted-foreground block text-xs">
                                {page.summary}
                              </span>
                            )}
                          </TableCell>
                          <TableCell data-label="Status">
                            <StatusPill status={page.status} />
                          </TableCell>
                          <TableCell data-label="Updated" className="text-muted-foreground text-xs">
                            {formatDateTime(page.updated_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-2 text-xs">
            A slug cannot be changed after creation because it is a live URL. To rename a page,
            create the new slug and redirect the old one.
          </p>
        </TabsContent>

        <TabsContent value="strings" className="mt-4">
          <Card className="overflow-hidden py-0">
            <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">
                Interface text{" "}
                <span className="text-muted-foreground font-normal">
                  ({stringRows.length} keys)
                </span>
              </h2>
              {untranslated > 0 && (
                <span className="text-status-warning text-sm font-medium">
                  {untranslated} incomplete
                </span>
              )}
            </div>
            <CardContent className="p-0">
              {stringRows.length === 0 ? (
                <NoResultsState />
              ) : (
                <div className="custom_scroll">
                  <Table className="stack-mobile">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Group</TableHead>
                        <TableHead className="w-56">Key</TableHead>
                        {CMS_LOCALES.map((code) => (
                          <TableHead key={code}>{LOCALE_LABELS[code]}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stringRows.map(([key, entry]) => (
                        <TableRow key={key}>
                          <TableCell data-full className="text-muted-foreground text-xs">
                            {entry.group}
                          </TableCell>
                          <TableCell data-label="Key" className="font-mono text-xs">
                            {key}
                            {entry.note && (
                              <span className="text-muted-foreground/70 block text-xs">
                                {entry.note}
                              </span>
                            )}
                          </TableCell>
                          {CMS_LOCALES.map((code: CmsLocale) => {
                            const value = entry.values.get(code);
                            return (
                              <TableCell data-label={LOCALE_LABELS[code]} key={code} className="text-sm">
                                {value?.trim() ? (
                                  value
                                ) : (
                                  <span className="text-status-warning text-xs font-medium">
                                    Missing
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardContent className="text-muted-foreground p-4 text-sm">
          <span className="text-foreground font-medium">Editing:</span> the API creates,
          updates and publishes pages, and saves interface text in bulk. The editors are not
          built yet: a page needs a Markdown field with a preview, and the string grid needs
          inline editing that batches every change into one save.
        </CardContent>
      </Card>
    </>
  );
}
