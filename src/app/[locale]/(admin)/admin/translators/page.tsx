"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { API_BASE_URL } from "@/shared/constants/api";
import { OrdersApiError, requestJson } from "@/features/orders/services/ordersService";
import {
  getDirectoryCandidates,
  getOrganizations,
  getTranslators,
  linkOrganization,
  saveTranslator,
  unlinkOrganization,
} from "@/features/orders/services/portalAdminService";
import type {
  AdminOrganization,
  AdminTranslator,
  DirectoryCandidates,
  DirectoryEntry,
  MatchReason,
} from "@/features/orders/types/types.Orders";
import {
  AccessRestricted,
  AdminButton,
  AdminInput,
  AdminPage,
  Message,
  Panel,
  Pill,
  colors,
} from "../_portal/ui";

/** A row of the .NET backend's user list, which spells the phone field two ways. */
interface SulikoUser {
  id: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  phoneNUmber?: string;
  firstName?: string;
  lastName?: string;
}

interface UserOption {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

function toOption(user: SulikoUser): UserOption {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return {
    id: user.id,
    name: name || user.userName || user.id,
    phone: user.phoneNumber || user.phoneNUmber || null,
    email: user.email || null,
  };
}

const MATCH_LABELS: Record<MatchReason, string> = {
  phone: "same phone",
  email: "same email",
  phone_and_email: "same phone and email",
};

export default function TranslatorsAdminPage() {
  const token = useAuthStore((state) => state.token);
  const [hydrated, setHydrated] = useState(false);
  const [translators, setTranslators] = useState<AdminTranslator[] | null>(null);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [users, setUsers] = useState<UserOption[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [error, setError] = useState<OrdersApiError | Error | null>(null);

  useEffect(() => setHydrated(true), []);

  const load = useCallback(async () => {
    try {
      const [list, orgs] = await Promise.all([getTranslators(), getOrganizations()]);
      setTranslators(list);
      setOrganizations(orgs);
      setError(null);
    } catch (loadError) {
      setError(loadError as Error);
      return;
    }
    try {
      const data = await requestJson<SulikoUser[] | { items?: SulikoUser[] }>(`${API_BASE_URL}/User`);
      setUsers((Array.isArray(data) ? data : data.items ?? []).map(toOption));
    } catch (usersLoadError) {
      setUsersError((usersLoadError as Error).message);
    }
  }, []);

  useEffect(() => {
    if (hydrated && token) void load();
  }, [hydrated, token, load]);

  if (!hydrated) return null;
  if (!token) return <AccessRestricted signedIn={false} />;
  if (error instanceof OrdersApiError && (error.status === 401 || error.status === 403)) {
    return <AccessRestricted signedIn={error.status === 403} />;
  }

  const upsert = (updated: AdminTranslator) =>
    setTranslators((current) => {
      const list = current ?? [];
      return list.some((t) => t.external_user_id === updated.external_user_id)
        ? list.map((t) => (t.external_user_id === updated.external_user_id ? updated : t))
        : [...list, updated].sort((a, b) => a.display_name.localeCompare(b.display_name));
    });

  return (
    <AdminPage
      title="Translators"
      subtitle="suliko.ge accounts that get the Orders tab, and the bureaus each one works for. A translator sees a bureau's documents once they are linked to that bureau's directory entry."
    >
      {error && <Message tone="error">{error.message}</Message>}

      <AddTranslatorPanel
        users={users}
        usersError={usersError}
        translators={translators ?? []}
        onAdded={upsert}
      />

      <Panel title={translators ? `Translators (${translators.length})` : "Translators"}>
        {translators === null ? (
          <Message>Loading…</Message>
        ) : translators.length === 0 ? (
          <Message>No translators yet. Find a suliko.ge account above and add it.</Message>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {translators.map((translator) => (
              <TranslatorRow
                key={translator.external_user_id}
                translator={translator}
                organizations={organizations}
                onChanged={upsert}
              />
            ))}
          </div>
        )}
      </Panel>
    </AdminPage>
  );
}

function AddTranslatorPanel({
  users,
  usersError,
  translators,
  onAdded,
}: {
  users: UserOption[] | null;
  usersError: string | null;
  translators: AdminTranslator[];
  onAdded: (translator: AdminTranslator) => void;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existing = useMemo(
    () => new Set(translators.map((t) => t.external_user_id)),
    [translators],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!users || needle.length < 2) return [];
    const digits = needle.replace(/\D/g, "");
    return users
      .filter(
        (user) =>
          user.name.toLowerCase().includes(needle) ||
          (user.email ?? "").toLowerCase().includes(needle) ||
          (digits.length >= 3 && (user.phone ?? "").replace(/\D/g, "").includes(digits)),
      )
      .slice(0, 10);
  }, [users, query]);

  const add = async (user: UserOption) => {
    setBusy(user.id);
    setError(null);
    try {
      onAdded(
        await saveTranslator(user.id, {
          display_name: user.name,
          phone: user.phone,
          email: user.email,
          is_active: true,
        }),
      );
    } catch (addError) {
      setError((addError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel title="Add a translator">
      {usersError ? (
        <Message tone="error">Could not load suliko.ge accounts: {usersError}</Message>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AdminInput
            value={query}
            placeholder={users ? "Search suliko.ge accounts by name, phone or email" : "Loading accounts…"}
            disabled={!users}
            onChange={(event) => setQuery(event.target.value)}
          />
          {error && <Message tone="error">{error}</Message>}
          {query.trim().length >= 2 && results.length === 0 && users && (
            <Message>No suliko.ge account matches “{query.trim()}”.</Message>
          )}
          {results.map((user) => (
            <div
              key={user.id}
              className="pa-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 8px",
                borderTop: `1px solid ${colors.border}`,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ color: colors.text, fontWeight: 500 }}>{user.name}</div>
                <div style={{ color: colors.faint, fontSize: 12 }}>
                  {[user.phone, user.email].filter(Boolean).join(" · ") || "No phone or email"}
                </div>
              </div>
              {existing.has(user.id) ? (
                <Pill tone="success">Already a translator</Pill>
              ) : (
                <AdminButton variant="primary" disabled={busy === user.id} onClick={() => void add(user)}>
                  {busy === user.id ? "Adding…" : "Add as translator"}
                </AdminButton>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function TranslatorRow({
  translator,
  organizations,
  onChanged,
}: {
  translator: AdminTranslator;
  organizations: AdminOrganization[];
  onChanged: (translator: AdminTranslator) => void;
}) {
  const [linking, setLinking] = useState<AdminOrganization | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedSlugs = new Set(translator.organizations.map((org) => org.slug));
  const available = organizations.filter((org) => !linkedSlugs.has(org.slug));

  const run = async (action: () => Promise<AdminTranslator | void>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      if (updated) onChanged(updated);
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "18px 8px",
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: colors.text, fontWeight: 600, fontSize: 15 }}>
              {translator.display_name}
            </span>
            <Pill tone={translator.is_active ? "success" : "danger"}>
              {translator.is_active ? "Active" : "Deactivated"}
            </Pill>
          </div>
          <div style={{ color: colors.faint, fontSize: 12, marginTop: 4 }}>
            {[translator.phone, translator.email].filter(Boolean).join(" · ")}
          </div>
          <code style={{ color: colors.faint, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
            {translator.external_user_id}
          </code>
        </div>
        <AdminButton
          variant={translator.is_active ? "danger" : "ghost"}
          disabled={busy}
          onClick={() =>
            void run(() =>
              saveTranslator(translator.external_user_id, {
                display_name: translator.display_name,
                phone: translator.phone,
                email: translator.email,
                is_active: !translator.is_active,
              }),
            )
          }
        >
          {translator.is_active ? "Deactivate" : "Reactivate"}
        </AdminButton>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {translator.organizations.length === 0 && (
          <span style={{ color: colors.faint, fontSize: 13 }}>
            Not linked to any bureau — only personal orders.
          </span>
        )}
        {translator.organizations.map((org) => (
          <span
            key={org.slug}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 6px 4px 12px",
              borderRadius: 999,
              border: `1px solid ${colors.border}`,
              color: colors.muted,
              fontSize: 13,
            }}
          >
            <span>
              <span style={{ color: colors.text }}>{org.name}</span>
              {org.translator_name && ` — as “${org.translator_name}”`}
            </span>
            <button
              type="button"
              title={`Unlink from ${org.name}`}
              aria-label={`Unlink from ${org.name}`}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await unlinkOrganization(translator.external_user_id, org.slug);
                  return {
                    ...translator,
                    organizations: translator.organizations.filter((o) => o.slug !== org.slug),
                  };
                })
              }
              style={{
                background: "transparent",
                border: "none",
                color: colors.danger,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              ×
            </button>
          </span>
        ))}
        {available.length > 0 && !linking && (
          <select
            value=""
            disabled={busy}
            onChange={(event) =>
              setLinking(available.find((org) => org.slug === event.target.value) ?? null)
            }
            style={{
              background: colors.page,
              color: colors.muted,
              border: `1px dashed ${colors.border}`,
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <option value="">+ Link to a bureau…</option>
            {available.map((org) => (
              <option key={org.slug} value={org.slug}>
                {org.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <Message tone="error">{error}</Message>}

      {linking && (
        <LinkPanel
          translator={translator}
          organization={linking}
          onClose={() => setLinking(null)}
          onLinked={(updated) => {
            onChanged(updated);
            setLinking(null);
          }}
        />
      )}
    </div>
  );
}

function LinkPanel({
  translator,
  organization,
  onClose,
  onLinked,
}: {
  translator: AdminTranslator;
  organization: AdminOrganization;
  onClose: () => void;
  onLinked: (translator: AdminTranslator) => void;
}) {
  const [candidates, setCandidates] = useState<DirectoryCandidates | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = useCallback(
    async (term?: string) => {
      setBusy(true);
      setError(null);
      try {
        setCandidates(await getDirectoryCandidates(translator.external_user_id, organization.slug, term));
      } catch (loadError) {
        setError((loadError as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [translator.external_user_id, organization.slug],
  );

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const link = async (translatorId: number | null) => {
    setBusy(true);
    setError(null);
    try {
      onLinked(await linkOrganization(translator.external_user_id, organization.slug, translatorId));
    } catch (linkError) {
      setError((linkError as Error).message);
      setBusy(false);
    }
  };

  const entryRow = (entry: DirectoryEntry) => (
    <div
      key={entry.id}
      className="pa-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 6px",
        borderTop: `1px solid ${colors.border}`,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
        <div style={{ color: colors.text }}>
          {entry.name}{" "}
          <span style={{ color: colors.faint, fontSize: 12 }}>#{entry.id}</span>
          {!entry.is_active && (
            <span style={{ color: colors.danger, fontSize: 12 }}> · inactive in the CRM</span>
          )}
        </div>
        <div style={{ color: colors.faint, fontSize: 12 }}>
          {[entry.phone, entry.email].filter(Boolean).join(" · ") || "No phone or email"}
        </div>
      </div>
      {entry.match && <Pill tone="amber">{MATCH_LABELS[entry.match]}</Pill>}
      {entry.linked_to_other_account ? (
        <Pill tone="danger">Linked to another account</Pill>
      ) : (
        <AdminButton variant="primary" disabled={busy} onClick={() => void link(entry.id)}>
          Link this entry
        </AdminButton>
      )}
    </div>
  );

  return (
    <div
      style={{
        border: `1px solid rgba(251,191,36,0.3)`,
        borderRadius: 10,
        padding: 16,
        background: "rgba(251,191,36,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ color: colors.text, fontWeight: 600 }}>
          Link {translator.display_name} to {organization.name}
        </div>
        <AdminButton onClick={onClose} disabled={busy}>
          Cancel
        </AdminButton>
      </div>

      <div style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
        If {organization.name} already has this person in its translator directory, link that entry so
        documents already assigned to them appear straight away. Otherwise create a new entry.
      </div>

      {error && <Message tone="error">{error}</Message>}

      {candidates === null ? (
        <Message>Looking for matches…</Message>
      ) : (
        <>
          <div>
            <div style={{ color: colors.faint, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Likely matches
            </div>
            {candidates.matches.length === 0 ? (
              <Message>No entry with the same phone or email.</Message>
            ) : (
              candidates.matches.map(entryRow)
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (search.trim()) void loadCandidates(search.trim());
            }}
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <AdminInput
              value={search}
              placeholder={`Search ${organization.name}'s directory`}
              onChange={(event) => setSearch(event.target.value)}
              style={{ flex: "1 1 260px" }}
            />
            <AdminButton type="submit" disabled={busy || !search.trim()}>
              Search
            </AdminButton>
          </form>
          {candidates.search_results.map(entryRow)}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <AdminButton variant="ghost" disabled={busy} onClick={() => void link(null)}>
              Create a new directory entry instead
            </AdminButton>
          </div>
        </>
      )}
    </div>
  );
}
