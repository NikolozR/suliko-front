// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { X } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { cancelTranslatorInviteAction } from "@office/features/translators/actions";
import { getTranslator, listTranslatorInvites } from "@office/features/translators/api";
import { InviteTranslatorForm } from "@office/features/translators/components/invite-translator-form";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@office/shared/components/ui/table";
import { sectionMark } from "@office/shared/config/navigation";
import { tolerate } from "@office/shared/lib/tolerate";
import { pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export const generateMetadata = pageTitle("inviteTranslator");

/**
 * Invite a translator, and see who is still waiting on a suliko.ge account.
 *
 * The waiting list closes the loop `GET /translators/invites` and
 * `DELETE /translators/invites/{id}` open: an invite that matched nobody does
 * not just sit silently — the bureau can see it and cancel it.
 *
 * Reached two ways: from "Invite translator" on the list (a blank form, which
 * creates a new directory row), or from an existing translator's own page
 * (`?translator_id=`, prefilled from that row, attaching to it instead).
 */
export default async function InviteTranslatorPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  await requirePermission("translators.write", locale);
  const t = await getTranslations("translators");
  const ti = await getTranslations("translators.inviteForm");
  const td = await getTranslations("directory");

  const query = await searchParams;
  const translatorId = Number.parseInt(one(query.translator_id) ?? "", 10);
  const existing = Number.isFinite(translatorId) ? await tolerate(getTranslator(translatorId)) : null;

  // Tolerated: this whole screen hinges on an endpoint new enough that an
  // out-of-step API deploy must degrade to "no waiting list", not a blank page.
  const invited = await tolerate(listTranslatorInvites());
  const pending = invited.data?.filter((invite) => invite.status === "pending") ?? [];

  return (
    <>
      <PageHeader
        {...sectionMark("translators")}
        title={existing?.data ? ti("titleNamed", { name: existing.data.name }) : ti("title")}
        description={ti("description")}
        actions={<BackLink href="/translators" label={t("backToTranslators")} />}
      />

      <InviteTranslatorForm
        translatorId={existing?.data ? translatorId : undefined}
        defaultValues={
          existing?.data
            ? {
                full_name: existing.data.name,
                email: existing.data.email ?? "",
                phone: existing.data.phone ?? "",
              }
            : undefined
        }
      />

      {pending.length > 0 && (
        <Card className="mt-6 max-w-2xl overflow-hidden py-0">
          <div className="border-border border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{ti("waitingTitle")}</h2>
            <p className="text-muted-foreground text-xs">{ti("waitingBody")}</p>
          </div>
          <CardContent className="p-0">
            <Table className="stack-mobile">
              <TableHeader>
                <TableRow>
                  <TableHead>{td("name")}</TableHead>
                  <TableHead>{td("email")}</TableHead>
                  <TableHead className="w-16 text-right">{ti("cancelCol")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell data-full className="font-medium">{invite.full_name}</TableCell>
                    <TableCell data-label={td("email")} className="text-muted-foreground text-sm">
                      {invite.email ?? invite.phone ?? "—"}
                    </TableCell>
                    <TableCell data-label={ti("cancelCol")}>
                      <form action={cancelTranslatorInviteAction} className="flex justify-end">
                        <input type="hidden" name="id" value={invite.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          type="submit"
                          aria-label={ti("cancelAria", { name: invite.full_name })}
                        >
                          <X />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
