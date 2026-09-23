import { requestJson } from "./ordersService";
import type {
  AdminDriveInfo,
  AdminOrganization,
  AdminTranslator,
  AdminTranslatorInput,
  DirectoryCandidates,
} from "../types/types.Orders";

/** Admin → Translators / Organizations. Server-side, only allowlisted admins get through. */

const admin = <T>(path: string, init?: RequestInit) => requestJson<T>(`/api/crm/admin${path}`, init);

const put = (body: unknown): RequestInit => ({
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const getDriveInfo = () => admin<AdminDriveInfo>("/drive");

export const getOrganizations = () => admin<AdminOrganization[]>("/organizations");

export const setOrganizationDrive = (slug: string, sharedDrive: string | null) =>
  admin<AdminOrganization>(`/organizations/${slug}/drive`, put({ shared_drive: sharedDrive }));

export const getTranslators = () => admin<AdminTranslator[]>("/translators");

export const saveTranslator = (externalUserId: string, input: AdminTranslatorInput) =>
  admin<AdminTranslator>(`/translators/${encodeURIComponent(externalUserId)}`, put(input));

export const getDirectoryCandidates = (externalUserId: string, slug: string, search?: string) =>
  admin<DirectoryCandidates>(
    `/translators/${encodeURIComponent(externalUserId)}/organizations/${slug}/candidates` +
      (search ? `?search=${encodeURIComponent(search)}` : ""),
  );

/** `translatorId: null` creates a new directory entry in that bureau from the account. */
export const linkOrganization = (externalUserId: string, slug: string, translatorId: number | null) =>
  admin<AdminTranslator>(
    `/translators/${encodeURIComponent(externalUserId)}/organizations/${slug}`,
    put({ translator_id: translatorId }),
  );

export const unlinkOrganization = (externalUserId: string, slug: string) =>
  admin<void>(`/translators/${encodeURIComponent(externalUserId)}/organizations/${slug}`, {
    method: "DELETE",
  });
