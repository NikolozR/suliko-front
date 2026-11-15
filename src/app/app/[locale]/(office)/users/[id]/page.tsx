// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Pencil, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { deleteUserAction } from "@office/features/users/actions";
import { getUser } from "@office/features/users/api";
import { AccessForm } from "@office/features/users/components/access-form";
import { AttachAccount } from "@office/features/users/components/attach-account";
import { ResendInvitation } from "@office/features/users/components/resend-invitation";
import { ResetMfaButton } from "@office/features/users/components/reset-mfa-button";
import { RoleBadge } from "@office/features/users/components/role-badge";
import { UserStateBadge } from "@office/features/users/components/user-state-badge";
import { groupsForPlan } from "@office/features/users/permission-catalogue";
import { userState } from "@office/features/users/status";
import { Link } from "@office/i18n/navigation";
import { requirePermission } from "@office/shared/auth/guards";
import { BackLink } from "@office/shared/components/back-link";
import { Detail, DetailList } from "@office/shared/components/detail-list";
import { ConfirmDeleteButton } from "@office/shared/components/form/confirm-delete-button";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@office/shared/components/ui/card";
import { sectionMark } from "@office/shared/config/navigation";
import { ApiError } from "@office/shared/lib/api";
import { formatDateTime } from "@office/shared/lib/dates";
import { pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle("user");

// The invitation actions on this page wait for the mail server, which may take
// several seconds, and the host's default limit for a request is shorter than
// that. Past it the host replaces the response with its own error page, after
// the email has already gone out.
export const maxDuration = 30;

export default async function UserDetailPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // `users.invite` opens the page read-only, with the invitation card. Editing,
  // switching off, deleting and access need `users.manage`.
  const session = await requirePermission("users.invite", locale);
  const canManage = session.permissions.includes("users.manage");
  const t = await getTranslations("users");
  const tCommon = await getTranslations("common");

  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  if (!/^\d+$/.test(id)) notFound();
  const userId = Number(id);

  let user;
  try {
    user = await getUser(userId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const isSelf = session.userId === user.id;
  // Not in yet: the invitation is still open, or they accepted but nothing on
  // suliko.ge has matched them (the invite list says "waiting").
  const invitationOpen = Boolean(user.invitation_pending);
  const acceptedNotJoined =
    !invitationOpen && user.suliko_account?.status === "pending" && !user.last_login_at;
  const canResend = user.is_active && !isSelf && (invitationOpen || acceptedNotJoined);
  // Invited at an address and not in yet: the person may have registered on
  // suliko.ge with a number instead, which no address will ever match. Someone
  // with no address was invited by number and is already on their own account.
  const canAttach =
    user.is_active && !isSelf && user.email !== null && userState(user) !== "signed_in";

  return (
    <>
      <PageHeader
        {...sectionMark("users")}
        title={user.username}
        description={user.full_name}
        actions={
          <>
            <BackLink href="/users" label={t("backToUsers")} />
            {canManage && (
              <Button variant="brand" size="sm" asChild>
                <Link href={`/users/${user.id}/edit`}>
                  <Pencil /> {tCommon("edit")}
                </Link>
              </Button>
            )}
            {/* The API refuses this anyway; not offering it is clearer than
                offering it and explaining the refusal afterwards. */}
            {canManage && !isSelf && (
              <ConfirmDeleteButton
                id={user.id}
                name={user.username}
                description={t("deleteDescription")}
                action={deleteUserAction}
              />
            )}
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <Trash2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("account")}</CardTitle>
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role} plan={session.plan} />
              <UserStateBadge user={user} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailList>
              <Detail label={t("username")} value={user.username} mono />
              <Detail label={t("userId")} value={String(user.id)} mono />
              <Detail label={t("fullName")} value={user.full_name} />
              <Detail label={t("email")} value={user.email} href={`mailto:${user.email}`} />
              <Detail label={t("position")} value={user.position} />
              <Detail label={t("phone")} value={user.phone} />
              <Detail
                label={t("lastLogin")}
                value={
                  user.last_login_at
                    ? formatDateTime(user.last_login_at, session.timezone)
                    : tCommon("never")
                }
              />
              <Detail label={t("created")} value={formatDateTime(user.created_at, session.timezone)} />
            </DetailList>
            {/* Lost or replaced phone: the one thing a user cannot fix alone. */}
            {canManage && !isSelf && session.mfaEnforced && (
              <ResetMfaButton userId={user.id} name={user.full_name || user.username} />
            )}
          </CardContent>
        </Card>

        {/* A password is the person's own, shared by every organisation
            they are in — nobody here sets it. They change it on their Account
            screen, or with "Forgot password". */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isSelf ? t("thisIsYou") : t("passwordIsTheirs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {isSelf ? t("thisIsYouBody") : t("passwordIsTheirsBody")}
            </p>
          </CardContent>
        </Card>
      </div>

      {canResend && (
        <ResendInvitation
          userId={user.id}
          accepted={acceptedNotJoined}
          count={user.invitation_count}
          lastSentAt={user.invitation_last_sent_at}
        />
      )}
      {canAttach && <AttachAccount userId={user.id} locale={locale} />}

      {/* What someone may do is for whoever manages users to read and change.
          Someone who only invites sees the account and the invitation. */}
      {canManage && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">
              {t("whatNameCanDo", { name: user.full_name })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* The EFFECTIVE set, not the role's bundle — the API has already
                applied this person's overrides and the tenant's plan. */}
            <AccessForm
              user={user}
              groups={groupsForPlan(session.plan)}
              grantable={session.permissions}
              isSelf={isSelf}
            />
            <p className="text-muted-foreground mt-5 text-xs">{t("accessFootnote")}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
