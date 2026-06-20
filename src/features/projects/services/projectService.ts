import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared/constants/api";
import { NameTranslationItem } from "@/features/translation/types/types.Translation";
import {
  ProjectDetailedResponse,
  ProjectNamesResponse,
  ProjectNameTranslation,
  ProjectResponse,
  ProjectsResponse,
} from "../types/types.Project";

/**
 * Centralized authenticated fetch handler
 */
const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const {
    token,
    refreshToken,
    setToken,
    setRefreshToken,
    reset,
  } = useAuthStore.getState();

  if (!token) throw new Error("No token found");

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  // Handle token expiration
  if (response.status === 401 && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as {
        token: string;
        refreshToken: string;
      };

      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);

      headers.set("Authorization", `Bearer ${newTokens.token}`);

      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        cache: "no-store",
      });
    } catch {
      reset();
      throw new Error("Token refresh failed");
    }
  }

  return response;
};

/**
 * Get all projects (folders) for the current user
 */
export const getProjects = async (): Promise<ProjectsResponse> => {
  const response = await fetchWithAuth("/projects");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch projects");
  }

  return response.json();
};

/**
 * Create a new project (folder)
 */
export const createProject = async (
  name: string
): Promise<ProjectResponse> => {
  const response = await fetchWithAuth("/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create project");
  }

  return response.json();
};

/**
 * Get a single project (folder) with its translations
 */
export const getProjectById = async (
  id: string
): Promise<ProjectDetailedResponse> => {
  const response = await fetchWithAuth(`/projects/${id}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch project");
  }

  return response.json();
};

/**
 * Rename a project (folder)
 */
export const renameProject = async (
  id: string,
  name: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetchWithAuth(`/projects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to rename project");
  }

  return response.json();
};

/**
 * Delete a project (folder) and cascade-delete its translations
 */
export const deleteProject = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetchWithAuth(`/projects/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete project");
  }

  return response.json();
};

/**
 * Get a project's consolidated name glossary (saved name-rendering pairs).
 */
export const getProjectNames = async (
  id: string
): Promise<ProjectNameTranslation[]> => {
  const response = await fetchWithAuth(`/projects/${id}/names`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch project names");
  }

  const json: ProjectNamesResponse = await response.json();
  return json.data ?? [];
};

/**
 * Add or update name pairs in a project's glossary (batch upsert, deduped by original).
 * Returns the full updated glossary.
 */
export const saveProjectNames = async (
  id: string,
  names: NameTranslationItem[]
): Promise<ProjectNameTranslation[]> => {
  const response = await fetchWithAuth(`/projects/${id}/names`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ names }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to save project names");
  }

  const json: ProjectNamesResponse = await response.json();
  return json.data ?? [];
};

/**
 * Remove a single name pair from a project's glossary.
 */
export const deleteProjectName = async (
  id: string,
  nameId: string
): Promise<void> => {
  const response = await fetchWithAuth(`/projects/${id}/names/${nameId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete project name");
  }
};
