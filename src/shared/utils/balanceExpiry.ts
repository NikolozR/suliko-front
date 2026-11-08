export type ExpiryLevel = "ok" | "soon" | "urgent" | "expired";

export interface BalanceExpiry {
  date: Date;
  daysLeft: number;
  level: ExpiryLevel;
}

export function getBalanceExpiry(iso?: string | null, now = new Date()): BalanceExpiry | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
  const level: ExpiryLevel = daysLeft <= 0 ? "expired" : daysLeft <= 3 ? "urgent" : daysLeft <= 7 ? "soon" : "ok";
  return { date, daysLeft, level };
}

export const EXPIRY_TEXT_CLASS: Record<ExpiryLevel, string> = {
  ok: "text-emerald-700/70 dark:text-emerald-400/70",
  soon: "text-amber-600 dark:text-amber-400",
  urgent: "text-red-600 dark:text-red-400 font-medium",
  expired: "text-red-600 dark:text-red-400 font-medium",
};
