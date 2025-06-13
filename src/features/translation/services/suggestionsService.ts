import { reaccessToken, useAuthStore } from "@/features/auth";
import {
    ApplySuggestionParams,
  SuggestionsResponse,
  SuggestionsResponseProcessing,
} from "../types/types.Translation";
import { API_BASE_URL } from "@/shared/constants/api";

export async function getSuggestions(
  jobId: string
): Promise<SuggestionsResponse | SuggestionsResponseProcessing> {
  const endpoint = `/Document/translate/suggestions/${jobId}`;

  const { token, refreshToken } = useAuthStore.getState();

  const headers = new Headers();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken);
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.accessToken);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
      });
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (response.status >= 200 && response.status < 300) {
    const data = (await response.json()) as SuggestionsResponse;
    return data;
  } else if (response.status === 400) {
    const data = (await response.json()) as SuggestionsResponseProcessing;
    return data;
  }

  throw new Error("Failed to fetch suggestions");
}


export async function applySuggestion(params: ApplySuggestionParams) {
    const endpoint = `/Document/apply-suggestion`;
    const {token, refreshToken} = useAuthStore.getState();
    const headers = new Headers();
    if (token) {
        headers.append("Authorization", `Bearer ${token}`);
    } else {
        throw new Error("No token found");
    }
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        method: "POST",
        body: JSON.stringify(params),
    })

    if (response.status === 401 && token && refreshToken) {
        try {
            const newTokens = await reaccessToken(refreshToken);
            const { setToken, setRefreshToken } = useAuthStore.getState();
            setToken(newTokens.accessToken);
            setRefreshToken(newTokens.refreshToken);
            headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              headers,
              method: "POST",
              body: JSON.stringify(params),
            });
          } catch {
            useAuthStore.getState().reset();
            throw new Error("Token refresh failed");
          }
    }


    const data = await response.json();
    console.log(data, "DEBUGGING application of suggestions");
    return data;
}