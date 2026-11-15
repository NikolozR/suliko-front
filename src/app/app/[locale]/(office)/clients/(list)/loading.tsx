// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { useTranslations } from "next-intl";

import { PageHeader } from "@office/shared/components/page-header";
import { TableSkeleton } from "@office/shared/components/data/states";
import { Card, CardContent } from "@office/shared/components/ui/card";
import { Skeleton } from "@office/shared/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";

/**
 * Shown while the client list is being fetched on the server.
 *
 * Shaped like the real page — same header, same seven columns — so the
 * transition is a fill rather than a jump. A generic spinner here would
 * reflow the whole layout the moment data arrives.
 */
export default function Loading() {
  const tNav = useTranslations("nav");
  const t = useTranslations("clients.col");
  return (
    <>
      <PageHeader {...sectionMark("clients")} title={tNav("clients")} />

      <Card className="overflow-hidden py-0">
        {/* The toolbar: search, the three client-type chips, the count. */}
        <div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <Skeleton className="h-9 min-w-48 flex-1 basis-56" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="ml-auto h-6 w-36 rounded-full" />
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {(["id", "name", "type", "email", "phone", "idNumber"] as const).map((key) => (
                  <TableHead key={key}>{t(key)}</TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton rows={8} columns={7} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
