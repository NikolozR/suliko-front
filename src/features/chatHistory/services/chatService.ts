// import { reaccessToken, useAuthStore } from "@/features/auth";
// import { API_BASE_URL } from "@/shared/constants/api";
// import {
//   ChatHistoryPaginationParams,
//   ChatHistoryResponse,
//   SingleChatHistoryResponse,
// } from "../types/types.Chat";

// export const getChatHistory = async (
//   params?: ChatHistoryPaginationParams
// ): Promise<ChatHistoryResponse> => {
//   const endpoint = "/document-translation/chat/user";

//   const { token, refreshToken } = useAuthStore.getState();

//   const headers = new Headers();
//   if (token) {
//     headers.append("Authorization", `Bearer ${token}`);
//   } else {
//     throw new Error("No token found");
//   }

//   // Add query parameters
//   const queryParams = new URLSearchParams({
//     pageSize: (params?.pageSize || 5).toString(),
//     pageNumber: (params?.pageNumber || 1).toString(),
//   });

//   let response = await fetch(
//     `${API_BASE_URL}${endpoint}?${queryParams.toString()}`,
//     {
//       method: "GET",
//       headers,
//       cache: "no-store",
//     }
//   );

//   if (response.status === 401 && token && refreshToken) {
//     try {
//       const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
//       const { setToken, setRefreshToken } = useAuthStore.getState();
//       setToken(newTokens.token);
//       setRefreshToken(newTokens.refreshToken);
//       headers.set("Authorization", `Bearer ${newTokens.token}`);
//       response = await fetch(
//         `${API_BASE_URL}${endpoint}?${queryParams.toString()}`,
//         {
//           method: "GET",
//           headers,
//           cache: "no-store",
//         }
//       );
//     } catch {
//       useAuthStore.getState().reset();
//       throw new Error("Token refresh failed");
//     }
//   }

//   if (response.status !== 200) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || "Chat history failed");
//   } else {
//     const data = await response.json();
//     return data;
//   }
// };

// export const getChatById = async (
//   chatId: string
// ): Promise<SingleChatHistoryResponse> => {
//   const endpoint = `/document-translation/chat/${chatId}`;

//   const { token, refreshToken } = useAuthStore.getState();

//   const headers = new Headers();
//   if (token) {
//     headers.append("Authorization", `Bearer ${token}`);
//   } else {
//     throw new Error("No token found");
//   }

//   let response = await fetch(`${API_BASE_URL}${endpoint}`, {
//     method: "GET",
//     headers,
//     cache: "no-store",
//   });
//   if (response.status === 401 && token && refreshToken) {
//     try {
//       const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
//       const { setToken, setRefreshToken } = useAuthStore.getState();
//       setToken(newTokens.token);
//       setRefreshToken(newTokens.refreshToken);
//       headers.set("Authorization", `Bearer ${newTokens.token}`);
//       response = await fetch(`${API_BASE_URL}${endpoint}`, {
//         method: "GET",
//         headers,
//         cache: "no-store",
//       });
//     } catch {
//       useAuthStore.getState().reset();
//       throw new Error("Token refresh failed");
//     }
//   }

//   if (response.status !== 200) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || "Failed to fetch chat");
//   } else {
//     const data = await response.json();
//     return data;
//   }
// };



// export const getSingleChatHistoryOriginalFile = async (id: string): Promise<File> => {
//   const endpoint = `/document-translation/chat/${id}/file`;
//   const { token, refreshToken } = useAuthStore.getState();

//   const headers = new Headers();
//   if (token) {
//     headers.append("Authorization", `Bearer ${token}`);
//   } else {
//     throw new Error("No token found");
//   }

//   let response = await fetch(`${API_BASE_URL}${endpoint}`, {
//     method: "GET",
//     headers,
//     cache: "no-store",
//   });

//   if (response.status === 401 && token && refreshToken) {
//     try {
//       const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
//       const { setToken, setRefreshToken } = useAuthStore.getState();
//       setToken(newTokens.token);
//       setRefreshToken(newTokens.refreshToken);
//       headers.set("Authorization", `Bearer ${newTokens.token}`);
//       response = await fetch(`${API_BASE_URL}${endpoint}`, {
//         method: "GET",
//         headers,
//         cache: "no-store",
//       });
//     } catch {
//       useAuthStore.getState().reset();
//       throw new Error("Token refresh failed");
//     }
//   }

//   if (response.status !== 200) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || "Chat history failed");
//   } else {
//     const data = await response.blob();
//     return data as File;
//   }
// };



import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared/constants/api";
import {
  ChatHistoryPaginationParams,
  ChatHistoryResponse,
  SingleChatHistoryResponse,
} from "../types/types.Chat";

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
 * Get paginated chat history
 */
export const getChatHistory = async (
  params?: ChatHistoryPaginationParams
): Promise<ChatHistoryResponse> => {
  const queryParams = new URLSearchParams({
    pageSize: (params?.pageSize || 5).toString(),
    pageNumber: (params?.pageNumber || 1).toString(),
  });

  const response = await fetchWithAuth(
    `/document-translation/chat/user?${queryParams.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Chat history failed");
  }

  return response.json();
};

/**
 * Get single chat by ID
 */
export const getChatById = async (
  chatId: string
): Promise<SingleChatHistoryResponse> => {
  const response = await fetchWithAuth(
    `/document-translation/chat/${chatId}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch chat");
  }

  return response.json();
};

/**
 * Get original uploaded file
 */
export const getSingleChatHistoryOriginalFile = async (
  id: string
): Promise<File> => {
  const response = await fetchWithAuth(
    `/document-translation/chat/${id}/file`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Chat history failed");
  }

  const blob = await response.blob();
  return blob as File;
};

/**
 * Update chat document content
 */
export const updateChatDocumentContent = async (
  chatId: string,
  newContent: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetchWithAuth(
    `/document-translation/chat/${chatId}/content`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newContent),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update document content");
  }

  return response.json();
};