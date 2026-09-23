"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { OrdersApiError } from "@/features/orders/services/ordersService";
import {
  getDriveInfo,
  getOrganizations,
  setOrganizationDrive,
} from "@/features/orders/services/portalAdminService";
import type { AdminDriveInfo, AdminOrganization } from "@/features/orders/types/types.Orders";
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

export default function OrganizationsAdminPage() {
  const token = useAuthStore((state) => state.token);
  const [hydrated, setHydrated] = useState(false);
  const [organizations, setOrganizations] = useState<AdminOrganization[] | null>(null);
  const [drive, setDrive] = useState<AdminDriveInfo | null>(null);
  const [error, setError] = useState<OrdersApiError | Error | null>(null);

  useEffect(() => setHydrated(true), []);

  const load = useCallback(async () => {
    try {
      const [orgs, driveInfo] = await Promise.all([getOrganizations(), getDriveInfo()]);
      setOrganizations(orgs);
      setDrive(driveInfo);
      setError(null);
    } catch (loadError) {
      setError(loadError as Error);
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

  const replace = (updated: AdminOrganization) =>
    setOrganizations((current) =>
      (current ?? []).map((org) => (org.slug === updated.slug ? updated : org)),
    );

  return (
    <AdminPage
      title="Organizations"
      subtitle="Partner bureaus in the CRM, and the Google Shared Drive each one keeps its order files in."
    >
      {error && <Message tone="error">{error.message}</Message>}

      <Panel title="Google Drive">
        {drive === null ? (
          <Message>Loading…</Message>
        ) : drive.configured ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: colors.muted, fontSize: 14 }}>
              Suliko&apos;s service account:{" "}
              <code
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: colors.amberLight,
                  fontSize: 13,
                  wordBreak: "break-all",
                }}
              >
                {drive.service_account_email}
              </code>
            </div>
            <ol style={{ color: colors.muted, fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
              <li>In Google Drive, the bureau opens its Shared Drive → Manage members.</li>
              <li>
                It adds the email above as <strong style={{ color: colors.text }}>Content manager</strong>.
              </li>
              <li>Paste the Shared Drive&apos;s link below and save. Suliko checks it can open the drive.</li>
            </ol>
            <Message>
              Files go to <em>Suliko Orders / #order · client / Document · languages / Source and Translation</em>.
              Staff can drop source files straight into a document&apos;s Source folder.
            </Message>
          </div>
        ) : (
          <Message tone="error">
            Google Drive is not configured on the API server. Set GOOGLE_SERVICE_ACCOUNT_FILE there to
            Suliko&apos;s service-account key, then reload this page.
          </Message>
        )}
      </Panel>

      <Panel title="Bureaus">
        {organizations === null ? (
          <Message>Loading…</Message>
        ) : organizations.length === 0 ? (
          <Message>No bureaus yet. They are created on the API server with the suliko CLI.</Message>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {organizations.map((org) => (
              <OrganizationRow
                key={org.slug}
                organization={org}
                driveConfigured={Boolean(drive?.configured)}
                onSaved={replace}
              />
            ))}
          </div>
        )}
      </Panel>
    </AdminPage>
  );
}

function OrganizationRow({
  organization,
  driveConfigured,
  onSaved,
}: {
  organization: AdminOrganization;
  driveConfigured: boolean;
  onSaved: (organization: AdminOrganization) => void;
}) {
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (value: string | null) => {
    setSaving(true);
    setError(null);
    try {
      onSaved(await setOrganizationDrive(organization.slug, value));
      setLink("");
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const statusTone =
    organization.status === "active" ? "success" : organization.status === "trial" ? "amber" : "danger";

  return (
    <div
      className="pa-row"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "16px 8px",
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: colors.text, fontWeight: 600, fontSize: 15 }}>{organization.name}</span>
        <code style={{ color: colors.faint, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          {organization.slug}
        </code>
        <Pill tone={statusTone}>{organization.status}</Pill>
        <Pill>
          {organization.translator_count} translator{organization.translator_count === 1 ? "" : "s"}
        </Pill>
        {organization.shared_drive_id ? (
          <Pill tone="success">Drive: {organization.drive_name ?? organization.shared_drive_id}</Pill>
        ) : (
          <Pill>No Drive connected</Pill>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <AdminInput
          value={link}
          placeholder={
            organization.shared_drive_id ? "Paste a different Shared Drive link" : "Paste the Shared Drive link"
          }
          onChange={(event) => setLink(event.target.value)}
          disabled={!driveConfigured || saving}
          style={{ flex: "1 1 320px" }}
        />
        <AdminButton
          variant="primary"
          disabled={!driveConfigured || saving || !link.trim()}
          onClick={() => void save(link.trim())}
        >
          {saving ? "Checking…" : organization.shared_drive_id ? "Change drive" : "Connect drive"}
        </AdminButton>
        {organization.shared_drive_id && (
          <AdminButton variant="danger" disabled={saving} onClick={() => void save(null)}>
            Disconnect
          </AdminButton>
        )}
      </div>

      {error && <Message tone="error">{error}</Message>}
    </div>
  );
}
