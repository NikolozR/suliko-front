// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import "server-only";

import { api } from "@office/shared/lib/api";

/**
 * Integration credentials, mirroring `api/v1/integrations.py`.
 *
 * The shape is asymmetric on purpose: rich going in, sparse coming out. A
 * stored secret is never returned — `secrets_set` lists which secret FIELDS
 * have a value, and that is the closest the API gets to revealing one.
 */

export type IntegrationProvider =
  | "google_drive"
  | "bog_ecommerce"
  | "bog_business"
  | "sms_office"
  | "smtp"
  | "elevenlabs"
  | "recaptcha"
  | "api24";

export interface IntegrationField {
  key: string;
  label: string;
  /** Write-only. Encrypted at rest, never sent back. */
  secret: boolean;
  required: boolean;
  multiline: boolean;
  help: string | null;
  placeholder: string | null;
}

export interface Integration {
  provider: IntegrationProvider;
  name: string;
  summary: string;
  /** What stops working when this is off. */
  enables: string;
  fields: IntegrationField[];
  is_enabled: boolean;
  /** Non-secret values only. */
  config: Record<string, unknown>;
  /** Names of secret fields that have a stored value — never the values. */
  secrets_set: string[];
  secrets_updated_at: string | null;
  last_check_at: string | null;
  last_check_ok: boolean | null;
  last_check_detail: string | null;
  is_complete: boolean;
}

export interface CheckResult {
  ok: boolean;
  detail: string;
}

export async function listIntegrations(): Promise<Integration[]> {
  return api<Integration[]>("/api/v1/integrations");
}

/**
 * Save a provider.
 *
 * `secrets` carries only the fields being CHANGED. A blank or omitted secret
 * keeps the stored one — the form cannot prefill what it may not read, so
 * blank is its resting state and must not be destructive. Clearing a secret
 * is `remove`, which is explicit.
 */
export async function saveIntegration(
  provider: IntegrationProvider,
  body: {
    is_enabled: boolean;
    config: Record<string, unknown>;
    secrets: Record<string, string>;
  },
): Promise<Integration> {
  return api<Integration>(`/api/v1/integrations/${provider}`, { method: "PUT", body });
}

export async function checkIntegration(provider: IntegrationProvider): Promise<CheckResult> {
  return api<CheckResult>(`/api/v1/integrations/${provider}/check`, { method: "POST" });
}

export async function removeIntegration(provider: IntegrationProvider): Promise<void> {
  await api<void>(`/api/v1/integrations/${provider}`, { method: "DELETE" });
}
