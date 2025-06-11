import { API_BASE_URL } from "@/shared/constants/api";
import { JobResultResponseOnError, JobStatusResponse } from "../types/types.Translation";
import { reaccessToken, useAuthStore } from "@/features/auth";

export async function getStatus(jobId: string): Promise<JobStatusResponse> {
  const endpoint = `/Document/translate/status/${jobId}`;
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
    const data = await response.json();
    console.log(data);
    return data;
  } else {
    throw new Error("Failed to get job status");
  }
}


export async function getResult(jobId: string): Promise<Blob | JobResultResponseOnError> {
  const endpoint = `/Document/translate/result/${jobId}`;
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
    const data = await response.blob();
    return data;
  } else if (response.status === 400) {
    const data = await response.json();
    return data as JobResultResponseOnError;
  } else {
    throw new Error("Failed to get job result");
  }
}

// {
//     "jobId": "14bb66f6-9fbb-4823-9361-ee529071fd0e",
//     "status": "Processing",
//     "progress": 10,
//     "message": "Translation in progress...",
//     "estimatedRemainingMinutes": 3
//   }

// after some time for /status endpoint
// {
//     "jobId": "14bb66f6-9fbb-4823-9361-ee529071fd0e",
//     "status": "Processing",
//     "progress": 10,
//     "message": "Translation in progress...",
//     "estimatedRemainingMinutes": 2
//   }

// when it is done for /status endpoint
// {
//     "jobId": "14bb66f6-9fbb-4823-9361-ee529071fd0e",
//     "status": "Completed",
//     "progress": 100,
//     "message": "Translation completed successfully",
//     "estimatedRemainingMinutes": 0
//   }

// for result endpoint when not done, error 400
// {
//     "jobId": "14bb66f6-9fbb-4823-9361-ee529071fd0e",
//     "status": "Processing",
//     "message": "Translation not completed yet"
//   }

// for result endpoint when done, code 200
// respoonse body downloadeable file
