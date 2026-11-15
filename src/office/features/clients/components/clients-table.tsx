// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ClientSummary } from "@office/features/clients/api";
import { ClientTypeBadge } from "@office/shared/components/status-badge";
import { Button } from "@office/shared/components/ui/button";
import { ClickableRow } from "@office/shared/components/data/clickable-row";
import { RowLink } from "@office/shared/components/data/row-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@office/shared/components/ui/table";
import { PhoneLink } from "@office/shared/components/phone-link";

/**
 * The clients table.
 *
 * A Server Component — it renders static markup from data the page already
 * fetched, so none of it ships to the browser. The only interactive parts are
 * links.
 *
 * Wrapped in `custom_scroll` with `overflow-x-auto`: the page body must never
 * scroll horizontally, so a table too wide for the viewport scrolls inside its
 * own container instead.
 */
export function ClientsTable({
  clients,
  canEdit = false,
}: {
  clients: ClientSummary[];
  /** `clients.write` — the edit icon leads to a page that would refuse anyone else. */
  canEdit?: boolean;
}) {
  const t = useTranslations("clients.col");
  const tc = useTranslations("common");
  return (
    <div className="custom_scroll">
      <Table className="stack-mobile">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">{t("id")}</TableHead>
            <TableHead>{t("name")}</TableHead>
            <TableHead className="w-24">{t("type")}</TableHead>
            <TableHead>{t("email")}</TableHead>
            <TableHead>{t("phone")}</TableHead>
            <TableHead className="w-32">{t("idNumber")}</TableHead>
            <TableHead className="w-24 text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clients.map((client) => (
            <ClickableRow key={client.id} href={`/clients/${client.id}`}>
              <TableCell data-label={t("id")} className="text-muted-foreground tabular-nums">{client.number}</TableCell>

              <TableCell data-label={t("name")} data-full className="font-medium">
                <RowLink
                  href={`/clients/${client.id}`}
                  title={client.name}
                  className="hover:text-link clamp-name transition-colors"
                >
                  {client.name}
                </RowLink>
              </TableCell>

              <TableCell data-label={t("type")}>
                <ClientTypeBadge clientType={client.client_type} />
              </TableCell>

              <TableCell data-label={t("email")}>
                {client.email ? (
                  // mailto rather than a plain string: staff phone and email
                  // these people constantly, and it is one of the small things
                  // the PHP app got right.
                  <a
                    href={`mailto:${client.email}`}
                    className="text-link hover:underline"
                  >
                    {client.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </TableCell>

              <TableCell data-label={t("phone")}>
                <PhoneLink phone={client.phone} />
              </TableCell>

              <TableCell data-label={t("idNumber")} className="text-muted-foreground font-mono text-xs">
                {/* Masked by the API — the full national ID needs the detail
                    endpoint, and revealing it is audit-logged. */}
                {client.personal_number_masked ?? "–"}
              </TableCell>

              <TableCell data-label={t("actions")} data-mobile-hidden>
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <Button variant="ghost" size="icon-sm" asChild aria-label={tc("edit")}>
                      <RowLink href={`/clients/${client.id}/edit`}>
                        <Pencil />
                      </RowLink>
                    </Button>
                  )}
                </div>
              </TableCell>
            </ClickableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
