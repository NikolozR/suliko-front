// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * A route's `generateMetadata`, giving its browser tab a name.
 *
 * Every tab used to read just "Suliko Office", so with three orders open
 * there was no telling them apart, and a screen reader announced the same
 * name on every page (audit F15, WCAG 2.4.2). The root layout's template adds
 * " · Suliko Office".
 *
 * `{id}` in the title is what `resolve` makes of the route's `[id]`: an
 * order's or client's number in the bureau, never the database id (F41).
 * The getters it calls are cached per request, so the page's own fetch
 * answers it. If it fails, the title falls back to `fallbackKey`.
 *
 *   export const generateMetadata = pageTitle("order", orderNumberOf, "orders");
 */
export function pageTitle(
  key: string,
  resolve?: (id: number) => Promise<number | string>,
  fallbackKey?: string,
) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string; id?: string }>;
  }): Promise<Metadata> {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: "titles" });
    if (!resolve) return { title: t(key, { id: id ?? "" }) };
    try {
      return { title: t(key, { id: await resolve(Number(id)) }) };
    } catch {
      return { title: t(fallbackKey ?? key, { id: "" }) };
    }
  };
}

/** An order's number in the bureau, for its pages' titles. */
export async function orderNumberOf(id: number): Promise<number> {
  const { getOrder } = await import("@office/features/orders/api");
  return (await getOrder(id)).number;
}

/** A client's number in the bureau, for its pages' titles. */
export async function clientNumberOf(id: number): Promise<number> {
  const { getClient } = await import("@office/features/clients/api");
  return (await getClient(id)).number;
}
