import { reaccessToken, useAuthStore } from "@/features/auth";
import {
    ApplySuggestionParams,
  ApplySuggestionResponse,
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
  if (token && typeof token === 'string' && token.trim()) {
    // Sanitize token to remove any invalid header characters
    const sanitizedToken = token.replace(/[\r\n\t]/g, '').trim();
    if (sanitizedToken) {
      headers.append("Authorization", `Bearer ${sanitizedToken}`);
      headers.append("Cache-Control", "no-cache");
      headers.append("Pragma", "no-cache");
      headers.append("Expires", "0");
    } else {
      throw new Error("Invalid token format");
    }
  } else {
    throw new Error("No valid token found");
  }
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    cache: "no-store"
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken);
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      
      // Sanitize the new token before using it
      const sanitizedNewToken = newTokens.token?.replace(/[\r\n\t]/g, '').trim();
      if (sanitizedNewToken) {
        headers.set("Authorization", `Bearer ${sanitizedNewToken}`);
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers,
          cache: "no-store"
        });
      } else {
        throw new Error("Invalid refreshed token format");
      }
      
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


export async function applySuggestion(params: ApplySuggestionParams): Promise<ApplySuggestionResponse> {
    const endpoint = `/Document/apply-suggestion`;
    const {token, refreshToken} = useAuthStore.getState();
    const headers = new Headers();
    if (token && typeof token === 'string' && token.trim()) {
        // Sanitize token to remove any invalid header characters
        const sanitizedToken = token.replace(/[\r\n\t]/g, '').trim();
        if (sanitizedToken) {
            headers.append("Authorization", `Bearer ${sanitizedToken}`);
            headers.append("Content-Type", "application/json");
        } else {
            throw new Error("Invalid token format");
        }
    } else {
        throw new Error("No valid token found");
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
            setToken(newTokens.token);
            setRefreshToken(newTokens.refreshToken);
            
            // Sanitize the new token before using it
            const sanitizedNewToken = newTokens.token?.replace(/[\r\n\t]/g, '').trim();
            if (sanitizedNewToken) {
                headers.set("Authorization", `Bearer ${sanitizedNewToken}`);
                response = await fetch(`${API_BASE_URL}${endpoint}`, {
                  headers,
                  method: "POST",
                  body: JSON.stringify(params),
                });
            } else {
                throw new Error("Invalid refreshed token format");
            }
          } catch {
            useAuthStore.getState().reset();
            throw new Error("Token refresh failed");
          }
    }


    if (response.status >= 200 && response.status < 300) {
      const data = await response.json();
      return data;

    }

    throw new Error("Failed to apply suggestion");
}