// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { getTranslations, setRequestLocale } from "next-intl/server";

import { InviteForm } from "@office/features/users/components/invite-form";
import { groupsForPlan } from "@office/features/users/permission-catalogue";
import { rolesUpTo } from "@office/features/users/roles";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { PageHeader } from "@office/shared/components/page-header";
import { sectionMark } from "@office/shared/config/navigation";
import { pageTitle } from "@office/shared/lib/page-title";

export const generateMetadata = pageTitle("inviteUser");

// Sending an invitation waits for the mail server, which can take several
// seconds. The host's default limit for a request is shorter, and past it the
// person gets the host's own error page for an invitation that went out.
export const maxDuration = 30;

/**
 * Invite someone to the bureau.
 *
 * The only way someone joins: a person who already has an account accepts
 * from the email; anyone else creates their account from it. Nobody here
 * ever sets or knows their password.
 */
export default async function InviteUserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requirePermission("users.invite", locale);
  const t = await getTranslations("users");

  // The catalogue is filtered by plan, so nobody is offered a box that the
  // API would refuse — ticking something and having it silently not apply is
  // worse than not seeing it at all.
  const groups = groupsForPlan(session.plan);

  return (
    <>
      <PageHeader
        {...sectionMark("users")}
        title={t("inviteTitle")}
        description={t("inviteDescription")}
        actions={<BackLink href="/users" label={t("backToUsers")} />}
      />
      <InviteForm groups={groups} grantable={session.permissions} roles={rolesUpTo(session.role)} />
    </>
  );
}
