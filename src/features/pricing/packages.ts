/** What each one-time package costs and gives. Pay as you go is 1 GEL a page. */
export const PACKAGES = {
  starter: { pages: 100, price: 20 },
  professional: { pages: 500, price: 50 },
} as const;

export const PAY_AS_YOU_GO_PER_PAGE = 1;

/** What a package saves, in GEL, against buying the same pages one by one. */
export const savingsGel = (p: { pages: number; price: number }) =>
  Math.max(0, p.pages * PAY_AS_YOU_GO_PER_PAGE - p.price);

/** The plans a link to /price may name in `?plan=`. */
export const PLAN_KEYS = ["starter", "professional", "payAsYouGo"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const isPlanKey = (value: string | null): value is PlanKey =>
  PLAN_KEYS.some((key) => key === value);
