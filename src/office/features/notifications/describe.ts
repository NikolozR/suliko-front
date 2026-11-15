// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { Notification } from "@office/features/notifications/api";
import { formatMoneyString } from "@office/shared/lib/money";
import { STATUS_DEFINITIONS, statusMessageKey } from "@office/shared/lib/statuses";

/**
 * A notification's sentence, in the reader's language.
 *
 * The API stores each notification as the English sentence it wrote at the
 * time (`api/v1/orders.py`, `finances.py`, `notifications.py`). Until it
 * stores a template key and parameters instead (on the roadmap), the known
 * sentence shapes are recognised here and re-told through the catalogue; one
 * this does not recognise is shown exactly as stored — never dropped.
 */

type Translate = (key: string, values?: Record<string, string | number>) => string;

const PATTERNS: {
  kind: Notification["kind"];
  pattern: RegExp;
  render: (match: RegExpExecArray, t: Translate, extra: Helpers) => string;
}[] = [
  {
    kind: "mention",
    pattern: /^mentioned you: ([\s\S]*)$/,
    render: (m, t) => t("mentioned", { excerpt: m[1] }),
  },
  {
    kind: "comment",
    pattern: /^commented: ([\s\S]*)$/,
    render: (m, t) => t("commented", { excerpt: m[1] }),
  },
  {
    kind: "payment",
    pattern: /^Payment received - ([\d.]+) GEL via ([a-z_]+)\.$/,
    render: (m, t, h) => t("payment", { amount: formatMoneyString(m[1]), method: h.method(m[2]) }),
  },
  {
    kind: "order_created",
    pattern: /^New order with (\d+) document\(s\)\.$/,
    render: (m, t) => t("orderCreated", { count: Number(m[1]) }),
  },
  {
    kind: "status_change",
    pattern: /^Status changed to (.+)\.$/,
    render: (m, t, h) => t("status", { status: h.status(m[1]) }),
  },
];

interface Helpers {
  method: (value: string) => string;
  status: (englishLabel: string) => string;
}

export function describeNotification(
  item: Notification,
  t: Translate,
  helpers: { method: (value: string) => string; statusLabel: (key: string) => string },
): string {
  const extra: Helpers = {
    method: helpers.method,
    // The sentence carries the English label; map it back to the status to
    // translate it. An unknown label passes through.
    status: (label) => {
      const entry = Object.entries(STATUS_DEFINITIONS).find(
        ([, definition]) => definition.label.toLowerCase() === label.toLowerCase(),
      );
      return entry ? helpers.statusLabel(statusMessageKey(entry[0])) : label;
    },
  };

  for (const { kind, pattern, render } of PATTERNS) {
    if (kind !== item.kind) continue;
    const match = pattern.exec(item.body);
    if (match) return render(match, t, extra);
  }
  return item.body;
}
