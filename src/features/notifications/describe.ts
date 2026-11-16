import type { TranslateNotification } from "./services/notificationService";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const text = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

/**
 * What an entry says, in the reader's language. The API stores a kind and a
 * small payload; the words are here. `t` is `useTranslations("Notifications")`.
 */
export function describeNotification(n: TranslateNotification, t: Translator): string {
  const p = n.payload ?? {};
  switch (n.kind) {
    case "batch_finished": {
      const failed = num(p.failed);
      const name = text(p.name);
      const values = { name, completed: num(p.completed), failed };
      if (failed > 0) return t(name ? "batchFinishedErrorsNamed" : "batchFinishedErrors", values);
      return t(name ? "batchFinishedNamed" : "batchFinished", values);
    }
    case "payment_succeeded":
      return t("paymentSucceeded", { amount: num(p.amount), currency: text(p.currency) || "GEL" });
    case "payment_failed":
      return t("paymentFailed", { amount: num(p.amount), currency: text(p.currency) || "GEL" });
    case "low_balance":
      return t("lowBalance", { balance: Math.max(0, Math.floor(num(p.balance))) });
    case "subscription_renewed":
      return t(text(p.plan) ? "subscriptionRenewedNamed" : "subscriptionRenewed", { plan: text(p.plan) });
    case "subscription_renewal_failed":
      return t(text(p.plan) ? "subscriptionRenewalFailedNamed" : "subscriptionRenewalFailed", { plan: text(p.plan) });
    default:
      // A kind this version of the site does not know yet.
      return t("unknown");
  }
}

/** "5 minutes ago", in the reader's language (the words are ours, so they match the rest of the page). */
export function relativeAge(createdAt: string, now: Date, t: Translator): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 1000));
  if (seconds < 60) return t("justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  return t("daysAgo", { count: Math.floor(hours / 24) });
}
