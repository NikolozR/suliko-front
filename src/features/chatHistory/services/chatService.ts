import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared/constants/api";
import { ChatHistoryPaginationParams, ChatHistoryResponse, SingleChatHistoryResponse } from "../types/types.Chat";

export const getChatHistory = async (params?: ChatHistoryPaginationParams): Promise<ChatHistoryResponse> => {
    const endpoint = "/document-translation/chat/user";
  
    const { token, refreshToken } = useAuthStore.getState();
  
    const headers = new Headers();
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    } else {
      throw new Error("No token found");
    }
  
    // Add query parameters
    const queryParams = new URLSearchParams({
      pageSize: (params?.pageSize || 5).toString(),
      pageNumber: (params?.pageNumber || 1).toString()
    });
  
    let response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams.toString()}`, {
      method: "GET",
      headers,
    });
  
    if (response.status === 401 && token && refreshToken) {
      try {
        const newTokens = await reaccessToken(refreshToken);
        const { setToken, setRefreshToken } = useAuthStore.getState();
        setToken(newTokens.accessToken);
        setRefreshToken(newTokens.refreshToken);
        headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
        response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams.toString()}`, {
          method: "GET",
          headers,
        });
      } catch {
        useAuthStore.getState().reset();
        throw new Error("Token refresh failed");
      }
    }
  
    if (response.status !== 200) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Chat history failed");
    } else {
      const data = await response.json();
      return data;
    }
  }

export const getChatById = async (chatId: string): Promise<SingleChatHistoryResponse> => {
  const endpoint = `/document-translation/chat/${chatId}`;

  const { token, refreshToken } = useAuthStore.getState();

  const headers = new Headers();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  } else {
    throw new Error("No token found");
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
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
        method: "GET",
        headers,
      });
    } catch {
      useAuthStore.getState().reset();
      throw new Error("Token refresh failed");
    }
  }

  if (response.status !== 200) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch chat");
  } else {
    const data = await response.json();
    return data;
  }
}


export const getSingleChatHistory = async (id: string) => {
    const endpoint = `/document-translation/chat/user/${id}`;
    const { token, refreshToken } = useAuthStore.getState();

    const headers = new Headers();
    if (token) {
        headers.append("Authorization", `Bearer ${token}`);
    } else {
        throw new Error("No token found");
    }

    let response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: "GET",
            headers,
        }
    );

    if (response.status === 401 && token && refreshToken) {
        try {
            const newTokens = await reaccessToken(refreshToken);
            const { setToken, setRefreshToken } = useAuthStore.getState();
            setToken(newTokens.accessToken);
            setRefreshToken(newTokens.refreshToken);
            headers.set("Authorization", `Bearer ${newTokens.accessToken}`);
            response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    method: "GET",
                    headers,
                }
            );
        } catch {
            useAuthStore.getState().reset();
            throw new Error("Token refresh failed");
        }
    }

    if (response.status !== 200) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Chat history failed");
    } else {
        const data = await response.json();
      return data;
    }
  }