// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { DatabaseZap, Lock, PlugZap, ServerCrash, Unplug } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Unavailable } from "@office/shared/lib/tolerate";
import { Card, CardContent } from "@office/shared/components/ui/card";

/**
 * Shown where data would have been, when the API could not supply it.
 *
 * Written for the person using the product, not for whoever runs the server:
 * a plain sentence, and the technical detail folded away under "Technical
 * details" where support can ask for it. The first version addressed the
 * reader as the operator ("run alembic upgrade head", endpoint lists) — right
 * for the one bureau that also runs the server, wrong for every customer.
 * The operator's version still reaches the server logs.
 */
export function ApiUnavailable({
  error,
  what,
  endpoints,
}: {
  error: Unavailable;
  /** What the user was trying to see, already translated ("the reports"). */
  what: string;
  /** Kept for the technical details. */
  endpoints?: string[];
}) {
  const t = useTranslations("errors");
  const Icon =
    error.reason === "forbidden"
      ? Lock
      : error.reason === "missing"
        ? PlugZap
        : error.reason === "unreachable"
          ? Unplug
          : error.reason === "schema"
            ? DatabaseZap
            : ServerCrash;

  if (error.reason === "forbidden") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Icon className="text-muted-foreground size-7" aria-hidden />
          <p className="text-muted-foreground text-sm">{t("forbidden")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-status-warning/40 bg-status-warning/[0.06]">
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <Icon className="text-status-warning size-8" aria-hidden />
        <p className="font-medium">{t("unavailableTitle", { what })}</p>
        <p className="text-muted-foreground max-w-lg text-sm">{t("unavailableBody")}</p>
        <details className="text-muted-foreground max-w-lg text-left text-xs">
          <summary className="cursor-pointer text-center">{t("technicalDetails")}</summary>
          <p className="mt-2 font-mono break-words">
            [{error.reason}] {error.detail}
          </p>
          {endpoints?.length ? (
            <ul className="mt-1 font-mono">
              {endpoints.map((endpoint) => (
                <li key={endpoint}>{endpoint}</li>
              ))}
            </ul>
          ) : null}
        </details>
      </CardContent>
    </Card>
  );
}

/** Compact inline form, for one card inside an otherwise-working page. */
export function ApiUnavailableInline({ error, what }: { error: Unavailable; what: string }) {
  const t = useTranslations("errors");
  if (error.reason === "forbidden") {
    return <p className="text-muted-foreground text-sm">{t("forbidden")}</p>;
  }
  return (
    <div className="border-status-warning/40 bg-status-warning/[0.06] flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
      <ServerCrash className="text-status-warning mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="text-muted-foreground">
        <span className="text-foreground font-medium">{t("unavailableInline", { what })}</span>{" "}
        <span title={error.detail}>{t("unavailableBody")}</span>
      </p>
    </div>
  );
}
