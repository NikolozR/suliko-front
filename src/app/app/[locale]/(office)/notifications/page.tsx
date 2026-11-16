// Owned by suliko-front: a second source tab, Translate's feed beside Office's.
import {
  AtSign, Bell, CircleDollarSign, FilePlus2, MessageSquare, Settings2,
} from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  listNotifications,
  NOTIFICATION_TABS,
  type Notification,
  type NotificationKind,
  type NotificationTab,
} from "@office/features/notifications/api";
import { MarkAllRead } from "@office/features/notifications/components/mark-all-read";
import { describeNotification } from "@office/features/notifications/describe";
import { redirectTo } from "@office/i18n/navigation";
import { requireSession } from "@office/shared/auth/guards";
import { planAllows } from "@office/shared/auth/plans";
import { ApiUnavailable } from "@office/shared/components/data/api-unavailable";
import { Pagination } from "@office/shared/components/data/pagination";
import { PageHeader } from "@office/shared/components/page-header";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { RowLink } from "@office/shared/components/data/row-link";
import { sectionMark } from "@office/shared/config/navigation";
import { formatDayHeading, formatTime, parseServerDate } from "@office/shared/lib/dates";
import { deniedQuery } from "@office/shared/lib/flash";
import { tolerate } from "@office/shared/lib/tolerate";
import { SegmentedCount, SegmentedNav, segmentedItem } from "@office/shared/components/segmented";
import { cn } from "@office/shared/lib/utils";
import { pageTitle } from "@office/shared/lib/page-title";
import { TranslateFeedPage } from "@/features/notifications/components/TranslateFeedPage";
import { translateMessages } from "@/shared/i18n/translateMessages";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const KIND_ICONS: Record<NotificationKind, typeof Bell> = {
  comment: MessageSquare,
  mention: AtSign,
  status_change: Settings2,
  payment: CircleDollarSign,
  order_created: FilePlus2,
  system: Bell,
};

const KIND_TONES: Record<NotificationKind, string> = {
  comment: "bg-muted text-muted-foreground",
  mention: "bg-suliko-default-color/15 text-link",
  status_change: "bg-status-info/15 text-status-info",
  payment: "bg-status-success/15 text-status-success",
  order_created: "bg-status-new/15 text-status-new",
  system: "bg-muted text-muted-foreground",
};

/**
 * Group into day buckets, preserving the API's newest-first order.
 *
 * A Map keeps insertion order, so the headings come out newest-day-first
 * without a second sort.
 */
function groupByDay(
  items: Notification[],
  options: Parameters<typeof formatDayHeading>[1],
): [string, Notification[]][] {
  const groups = new Map<string, Notification[]>();
  for (const item of items) {
    const heading = formatDayHeading(item.created_at, options);
    const bucket = groups.get(heading);
    if (bucket) bucket.push(item);
    else groups.set(heading, [item]);
  }
  return [...groups];
}

function Entry({
  item,
  sentence,
  labels,
  timeZone,
}: {
  item: Notification;
  sentence: string;
  labels: { system: string; new: string };
  timeZone: string;
}) {
  const Icon = KIND_ICONS[item.kind] ?? Bell;
  const tone = KIND_TONES[item.kind] ?? KIND_TONES.system;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        item.order_id && "hover:bg-muted/50",
        !item.is_read && "bg-suliko-default-color/[0.04]",
      )}
    >
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
        <Icon className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {item.actor_name ? (
            <span className="font-medium">{item.actor_name} </span>
          ) : (
            <span className="text-muted-foreground font-medium">{labels.system} </span>
          )}
          <span>{sentence}</span>
        </p>
        {item.subject_label && (
          <p className="text-muted-foreground mt-0.5 text-xs">{item.subject_label}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!item.is_read && (
          <span className="bg-suliko-default-color rounded-full px-2 py-0.5 text-xs font-semibold text-white">
            {labels.new}
          </span>
        )}
        <time
          className="text-muted-foreground text-xs tabular-nums"
          dateTime={parseServerDate(item.created_at)?.toISOString()}
        >
          {formatTime(item.created_at, timeZone)}
        </time>
      </div>
    </div>
  );

  // Comment and mention entries deep-link to the order's thread; the rest go
  // to the order itself. A system notice with no order is not a link at all.
  if (!item.order_id) return content;

  const anchor = item.comment_id ? "#comments" : "";
  return <RowLink href={`/translations/${item.order_id}${anchor}`}>{content}</RowLink>;
}

export const generateMetadata = pageTitle("notifications");

export default async function NotificationsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // No permission gate: the feed is scoped to you server-side, and every role
  // has one. The plan does gate it — a freelancer has nobody to be notified
  // by, and the API refuses the feed, so the page would only ever show an
  // error.
  const session = await requireSession(locale);
  if (!planAllows(session.plan, "notifications")) {
    redirectTo(`/dashboard?${deniedQuery("plan")}`, locale);
  }

  const t = await getTranslations("nav");
  const tn = await getTranslations("notifications");
  const tb = await getTranslations("notifications.body");
  const tm = await getTranslations("enums.paymentMethod");
  const ts = await getTranslations("statuses");
  const query = await searchParams;

  // The one bell has two feeds: Office's (this page) and Translate's (payments,
  // finished batches, balance, renewals), kept by suliko.ge's API.
  const source = one(query.source) === "translate" ? "translate" : "office";
  // Translate's texts; this page loads only Office's.
  const trMessages = await translateMessages(locale, ["Notifications"]);
  const tTr = (key: string) => String((trMessages.Notifications as Record<string, unknown>)[key] ?? key);
  const sources = (
    <SegmentedNav label={tTr("sourceLabel")} className="mb-4">
      {(["office", "translate"] as const).map((key) => {
        const selected = key === source;
        return (
          <RowLink
            key={key}
            href={key === "office" ? "/notifications" : "/notifications?source=translate"}
            aria-current={selected ? "page" : undefined}
            className={segmentedItem(selected)}
          >
            {key === "office" ? tTr("sourceOffice") : tTr("sourceTranslate")}
          </RowLink>
        );
      })}
    </SegmentedNav>
  );

  if (source === "translate") {
    return (
      <>
        <PageHeader {...sectionMark("notifications")} title={t("notifications")} description={tn("description")} />
        {sources}
        <NextIntlClientProvider locale={locale} messages={trMessages}>
          <TranslateFeedPage />
        </NextIntlClientProvider>
      </>
    );
  }

  const rawTab = one(query.tab);
  const tab: NotificationTab = NOTIFICATION_TABS.includes(rawTab as NotificationTab)
    ? (rawTab as NotificationTab)
    : "all";
  const offset = Math.max(0, Number.parseInt(one(query.offset) ?? "0", 10) || 0);

  const result = await tolerate(listNotifications({ tab, offset }));
  if (!result.data) {
    return (
      <>
        <PageHeader
          {...sectionMark("notifications")}
          title={t("notifications")}
          description={tn("description")}
        />
        <ApiUnavailable
          error={result.error}
          what={tn("what")}
          endpoints={["GET /api/v1/notifications"]}
        />
      </>
    );
  }

  const feed = result.data;
  const groups = groupByDay(feed.items, {
    timeZone: session.timezone,
    locale,
    today: tn("today"),
    yesterday: tn("yesterday"),
  });
  const sentence = (item: Notification) =>
    describeNotification(item, (key, values) => tb(key, values), {
      method: (value) => (tm.has(value) ? tm(value) : value),
      statusLabel: (key) => (ts.has(key) ? ts(key) : key),
    });
  const labels = { system: tn("system"), new: tn("new") };

  return (
    <>
      <PageHeader
        {...sectionMark("notifications")}
        title={t("notifications")}
        description={tn("description")}
        actions={<MarkAllRead unread={feed.unread} />}
      />

      {sources}

      <SegmentedNav label={tn("filterLabel")} className="mb-4">
        {NOTIFICATION_TABS.map((key) => {
          const selected = key === tab;
          return (
            <RowLink
              key={key}
              href={`/notifications?tab=${key}`}
              aria-current={selected ? "page" : undefined}
              className={segmentedItem(selected)}
            >
              {tn(`tabs.${key}`)}
              {key === "unread" && feed.unread > 0 && (
                <SegmentedCount selected={selected}>{feed.unread}</SegmentedCount>
              )}
            </RowLink>
          );
        })}
      </SegmentedNav>

      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          {feed.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Bell className="text-muted-foreground/40 size-8" aria-hidden />
              <p className="text-sm font-medium">
                {tab === "unread" ? tn("nothingUnread") : tn("nothingHere")}
              </p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {tab === "mentions" ? tn("mentionsHint") : tn("feedHint")}
              </p>
            </div>
          ) : (
            <>
              {groups.map(([heading, items]) => (
                <section key={heading}>
                  <h2 className="bg-muted/40 text-muted-foreground border-border border-y px-4 py-1.5 text-xs font-medium">
                    {heading}
                  </h2>
                  <ul className="divide-border divide-y">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Entry
                          item={item}
                          sentence={sentence(item)}
                          labels={labels}
                          timeZone={session.timezone}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <Pagination
                total={feed.meta.total}
                limit={feed.meta.limit}
                offset={feed.meta.offset}
                basePath="/notifications"
                params={{ tab }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
