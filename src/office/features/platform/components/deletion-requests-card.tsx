// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { CircleAlert, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { DeletionFinding, DeletionRequest } from "@office/features/platform/api";
import { DeletionReviewActions } from "@office/features/platform/components/deletion-review-actions";
import { ApiUnavailableInline } from "@office/shared/components/data/api-unavailable";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { formatDate, formatDateTime } from "@office/shared/lib/dates";
import { formatMoneyString } from "@office/shared/lib/money";
import type { Unavailable } from "@office/shared/lib/tolerate";

type Translate = Awaited<ReturnType<typeof getTranslations<"platform.deletion">>>;

function findingText(t: Translate, finding: DeletionFinding): string {
  const organisation = finding.organisation;
  const count = finding.count ?? 0;
  const amount = formatMoneyString(finding.amount);
  switch (finding.code) {
    case "only_owner":
      return t("finding.only_owner", { organisation });
    case "open_orders":
      return t("finding.open_orders", { organisation, count });
    case "unpaid_orders":
      return t("finding.unpaid_orders", { organisation, count, amount });
    case "payouts_owed":
      return t("finding.payouts_owed", { organisation, amount });
  }
}

/**
 * People who asked for their Suliko Office account to be deleted.
 *
 * Each waiting request shows who, when, which organisations they belong to and
 * what Office found that may count as an obligation, so the reviewer decides
 * with it in front of them. Below, the latest that are over.
 */
export async function DeletionRequestsCard({
  open,
  decided,
  timeZone,
  error,
}: {
  open: DeletionRequest[];
  decided: DeletionRequest[];
  timeZone: string;
  /** The list could not be read: said so instead of showing "no requests". */
  error?: Unavailable | null;
}) {
  const t = await getTranslations("platform.deletion");

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </CardHeader>
      <CardContent className="p-0">
        {error ? (
          <div className="p-4">
            <ApiUnavailableInline error={error} what={t("listWhat")} />
          </div>
        ) : open.length === 0 && decided.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("none")}</p>
        ) : (
          <>
            <ul className="divide-border divide-y">
              {open.map((request) => (
                <li key={request.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block font-medium">{request.name}</span>
                      <span className="text-muted-foreground block text-xs break-all">
                        {request.login}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {request.organisations.length > 0
                          ? t("member", { names: request.organisations.join(", ") })
                          : t("noOrganisation")}
                      </span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="block font-medium">{t(`status.${request.status}`)}</span>
                      <span className="text-muted-foreground block">
                        {t("filed", { when: formatDateTime(request.requested_at, timeZone) })}
                      </span>
                      {request.purge_after && (
                        <span className="text-muted-foreground block">
                          {t("purgeOn", { when: formatDate(request.purge_after) })}
                        </span>
                      )}
                    </div>
                  </div>

                  {request.status === "requested" && (
                    <div className="bg-muted/40 rounded-md p-3 text-sm">
                      <p className="font-medium">{t("findingsTitle")}</p>
                      {request.findings.length === 0 ? (
                        <p className="text-muted-foreground mt-1">{t("noFindings")}</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {request.findings.map((finding) => (
                            <li
                              key={`${finding.code}-${finding.organisation}`}
                              className="flex items-start gap-2"
                            >
                              {finding.blocking ? (
                                <ShieldAlert
                                  className="text-destructive mt-0.5 size-4 shrink-0"
                                  aria-hidden
                                />
                              ) : (
                                <CircleAlert
                                  className="text-status-warning mt-0.5 size-4 shrink-0"
                                  aria-hidden
                                />
                              )}
                              <span className={finding.blocking ? "text-destructive" : undefined}>
                                {findingText(t, finding)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-muted-foreground mt-2 text-xs">{t("sulikoBalance")}</p>
                    </div>
                  )}

                  {request.review_note && (
                    <p className="text-muted-foreground text-xs">
                      {t("noteShown", { note: request.review_note })}
                    </p>
                  )}

                  <DeletionReviewActions
                    id={request.id}
                    name={request.name}
                    approved={request.status === "approved"}
                    blocked={request.findings.some((finding) => finding.blocking)}
                    hasFindings={request.findings.length > 0}
                  />
                </li>
              ))}
            </ul>

            {decided.length > 0 && (
              <div className="border-border border-t">
                <p className="text-muted-foreground px-4 pt-3 text-xs font-medium uppercase">
                  {t("recent")}
                </p>
                <ul className="divide-border divide-y">
                  {decided.map((request) => (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">{request.name}</span>
                        <span className="text-muted-foreground"> · {t(`status.${request.status}`)}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDateTime(request.done_at ?? request.decided_at ?? request.requested_at, timeZone)}
                        {request.review_note && ` · ${request.review_note}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
