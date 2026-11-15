// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import { Pencil, Shield, UserPlus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { listUsers, type Role } from "@office/features/users/api";
import { deleteUserAction } from "@office/features/users/actions";
import { RoleBadge } from "@office/features/users/components/role-badge";
import { ResendFromList } from "@office/features/users/components/resend-from-list";
import { UserStateBadge } from "@office/features/users/components/user-state-badge";
import { rolesUpTo } from "@office/features/users/roles";
import {
  userState,
  isUserFilterState,
  USER_FILTER_STATES,
  type UserFilterState,
} from "@office/features/users/status";
import { Link } from "@office/i18n/navigation";
import { requirePermission } from "@office/shared/auth/guards";
import { Pagination, ResultCount } from "@office/shared/components/data/pagination";
import { SearchFilters } from "@office/shared/components/data/search-filters";
import {
  NoResultsState,
  PastLastPageState,
} from "@office/shared/components/data/states";
import { ConfirmDeleteButton } from "@office/shared/components/form/confirm-delete-button";
import { PageHeader } from "@office/shared/components/page-header";
import { Button } from "@office/shared/components/ui/button";
import { Card, CardContent } from "@office/shared/components/ui/card";
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
import { sectionMark } from "@office/shared/config/navigation";
import { formatDateTime } from "@office/shared/lib/dates";
import { pageTitle } from "@office/shared/lib/page-title";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const ROLES: Role[] = ["owner", "admin", "manager", "staff"];

export const generateMetadata = pageTitle("users");

export default async function UsersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Hiding the nav item is not enough — this URL is guessable. `users.invite`
  // is enough to see the list; changing anyone needs `users.manage`.
  const session = await requirePermission("users.invite", locale);
  const canManage = session.permissions.includes("users.manage");
  // Someone who only invites sees the members up to their own role, so the
  // filter offers only those.
  const allowedRoles: readonly string[] = rolesUpTo(session.role);
  const visibleRoles = canManage
    ? ROLES
    : ROLES.filter((r) => allowedRoles.includes(r));

  const t = await getTranslations("users");
  const tCommon = await getTranslations("common");
  const tRole = await getTranslations("enums.role");
  const stateLabel: Record<UserFilterState, string> = {
    invited: t("invited"),
    not_signed_in: t("stateNotSignedIn"),
    signed_in: t("active"),
  };
  const query = await searchParams;

  const search = one(query.search);
  const rawRole = one(query.role);
  const role = visibleRoles.includes(rawRole as Role)
    ? (rawRole as Role)
    : undefined;
  const rawState = one(query.state);
  const state = isUserFilterState(rawState) ? rawState : undefined;
  const offset = Math.max(
    0,
    Number.parseInt(one(query.offset) ?? "0", 10) || 0,
  );

  const { items, meta } = await listUsers({ search, role, state, offset });

  return (
    <>
      <PageHeader
        {...sectionMark("users")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button variant="brand" size="sm" asChild>
              <Link href="/users/invite" data-tip="users-invite">
                <UserPlus /> {t("invite")}
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden py-0">
        <SearchFilters
          title={t("title")}
          count={<ResultCount shown={items.length} total={meta.total} />}
          search={search}
          searchPlaceholder={t("searchPlaceholder")}
          selects={[
            {
              name: "role",
              label: t("role"),
              value: rawRole,
              options: visibleRoles.map((r) => ({ value: r, label: tRole(r) })),
            },
            {
              // Where each person is: the way to find who is still waiting.
              name: "state",
              label: t("status"),
              value: rawState,
              options: USER_FILTER_STATES.map((s) => ({
                value: s,
                label: stateLabel[s],
              })),
            },
          ]}
        />

        <CardContent className="p-0">
          {items.length === 0 ? (
            offset > 0 && meta.total > 0 ? (
              <PastLastPageState firstPageHref="/users" />
            ) : (
              <NoResultsState />
            )
          ) : (
            <>
              {/* From laptop to desktop width the ID and position columns give way, so the row
                  and its actions fit without sideways scrolling. */}
              <div className="custom_scroll">
                <Table className="stack-mobile">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 lg:max-2xl:hidden">{t("id")}</TableHead>
                      <TableHead>{t("username")}</TableHead>
                      <TableHead>{t("fullName")}</TableHead>
                      <TableHead className="w-40 lg:max-2xl:hidden">{t("position")}</TableHead>
                      <TableHead className="lg:max-xl:hidden">{t("email")}</TableHead>
                      <TableHead className="w-28">{t("role")}</TableHead>
                      <TableHead className="w-40">{t("status")}</TableHead>
                      <TableHead className="w-40">{t("lastLogin")}</TableHead>
                      <TableHead className="w-20 text-right">
                        {t("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((user) => (
                      <ClickableRow key={user.id} href={`/users/${user.id}`}>
                        <TableCell
                          data-label={t("id")}
                          className="text-muted-foreground tabular-nums lg:max-2xl:hidden"
                        >
                          {user.id}
                        </TableCell>
                        <TableCell
                          data-label={t("username")}
                          className="font-medium"
                        >
                          <RowLink
                            href={`/users/${user.id}`}
                            className="hover:text-link transition-colors"
                          >
                            {user.username}
                          </RowLink>
                        </TableCell>
                        <TableCell data-label={t("fullName")}>
                          {user.full_name}
                        </TableCell>
                        <TableCell
                          data-label={t("position")}
                          className="text-muted-foreground text-sm lg:max-2xl:hidden"
                        >
                          {user.position ?? "–"}
                        </TableCell>
                        <TableCell
                          data-label={t("email")}
                          className="text-muted-foreground text-sm lg:max-xl:hidden"
                        >
                          {user.email ?? "–"}
                        </TableCell>
                        <TableCell data-label={t("role")}>
                          <RoleBadge role={user.role} plan={session.plan} />
                        </TableCell>
                        <TableCell data-label={t("status")}>
                          <UserStateBadge user={user} />
                        </TableCell>
                        <TableCell
                          data-label={t("lastLogin")}
                          className="text-muted-foreground text-xs"
                        >
                          {user.last_login_at
                            ? formatDateTime(
                                user.last_login_at,
                                session.timezone,
                              )
                            : tCommon("never")}
                        </TableCell>
                        <TableCell data-label={t("actions")} data-mobile-hidden>
                          <div className="flex justify-end gap-1">
                            {/* Anyone who has not got in can be sent the invitation again. */}
                            {(userState(user) === "invited" ||
                              userState(user) === "not_signed_in") &&
                              session.userId !== user.id && (
                                <ResendFromList
                                  userId={user.id}
                                  name={user.full_name || user.username}
                                  accepted={userState(user) === "not_signed_in"}
                                />
                              )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                asChild
                                aria-label={tCommon("edit")}
                              >
                                <RowLink href={`/users/${user.id}/edit`}>
                                  <Pencil />
                                </RowLink>
                              </Button>
                            )}
                            {/* Not offered for yourself: the API refuses it anyway. */}
                            {canManage && session.userId !== user.id && (
                              <ConfirmDeleteButton
                                compact
                                id={user.id}
                                name={user.username}
                                description={t("deleteDescription")}
                                action={deleteUserAction}
                              />
                            )}
                          </div>
                        </TableCell>
                      </ClickableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                total={meta.total}
                limit={meta.limit}
                offset={meta.offset}
                basePath="/users"
                params={{ search, role: rawRole, state: rawState }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Shield
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <div className="text-muted-foreground space-y-1">
            <p className="text-foreground font-medium">{t("rulesTitle")}</p>
            <p>{t("rulesBody")}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
