import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared/constants/api";
import {
  BatchListResponse,
  BatchResponse,
  CreateBatchRequest,
} from "../types/types.Bulk";

/**
 * Authenticated fetch with one transparent token refresh, matching the pattern used by
 * projectService so batch calls behave identically on an expired session.
 */
const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const { token, refreshToken, setToken, setRefreshToken, reset } =
    useAuthStore.getState();

  if (!token) throw new Error("No token found");

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

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

const readError = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => ({}));
  return new Error(body.message || fallback);
};

/**
 * Queues a folder of documents. Returns as soon as the batch is persisted — translation
 * happens in the backend worker pool, so this does not wait for any document to finish.
 */
export const createBatch = async (
  request: CreateBatchRequest
): Promise<BatchResponse> => {
  const response = await fetchWithAuth("/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) throw await readError(response, "Failed to queue the batch");

  return response.json();
};

/** Current status of a batch, including every document's individual state. */
export const getBatch = async (batchId: string): Promise<BatchResponse> => {
  const response = await fetchWithAuth(`/batches/${batchId}`);

  if (!response.ok) throw await readError(response, "Failed to load the batch");

  return response.json();
};

export const getProjectBatches = async (
  projectId: string
): Promise<BatchListResponse> => {
  const response = await fetchWithAuth(`/batches?projectId=${projectId}`);

  if (!response.ok) throw await readError(response, "Failed to load batches");

  return response.json();
};

/** Drops queued documents. Documents already translating are left to finish. */
export const cancelBatch = async (
  batchId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetchWithAuth(`/batches/${batchId}/cancel`, {
    method: "POST",
  });

  if (!response.ok) throw await readError(response, "Failed to cancel the batch");

  return response.json();
};

/** Requeues only the documents that failed, each with a fresh attempt budget. */
export const retryFailedItems = async (
  batchId: string
): Promise<{ success: boolean; requeuedCount: number }> => {
  const response = await fetchWithAuth(`/batches/${batchId}/retry-failed`, {
    method: "POST",
  });

  if (!response.ok) throw await readError(response, "Failed to retry the batch");

  return response.json();
};
