import { API_BASE_URL } from "@/shared/constants/api";

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  credentials?: RequestCredentials;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  ok: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public isCorsError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async makeRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      credentials = 'include'
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Remove undefined values
    Object.keys(requestHeaders).forEach(key => {
      if (requestHeaders[key] === undefined) {
        delete requestHeaders[key];
      }
    });

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials,
        mode: 'cors', // Explicitly set CORS mode
      });

      // Check if it's a CORS error
      if (!response.ok && response.status === 0) {
        throw new ApiError(
          'CORS error: Unable to connect to the server. Please check your network connection or contact support.',
          0,
          'CORS Error',
          true
        );
      }

      let data: T;
      try {
        data = await response.json();
      } catch {
        // If JSON parsing fails, it might be a CORS issue
        if (!response.ok) {
          throw new ApiError(
            'CORS error: Server response could not be parsed. This might be due to CORS restrictions.',
            response.status,
            response.statusText,
            true
          );
        }
        data = {} as T;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      };
    } catch (error) {
      // Handle network errors that might be CORS-related
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(
          'CORS error: Network request failed. This might be due to CORS restrictions or network issues.',
          0,
          'Network Error',
          true
        );
      }

      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        'Unknown Error',
        false
      );
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'POST', body, headers });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'PUT', body, headers });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE', headers });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'PATCH', body, headers });
  }

  // Helper method to handle common error scenarios
  static handleApiError(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.isCorsError) {
        return error.message;
      }
      return error.message;
    }

    if (error instanceof Error) {
      // Check for common CORS error patterns
      if (error.message.includes('CORS') || 
          error.message.includes('cross-origin') ||
          error.message.includes('Access-Control-Allow-Origin')) {
        return 'CORS error: Unable to connect to the server. Please check your network connection or contact support.';
      }
      return error.message;
    }

    return 'An unknown error occurred. Please try again.';
  }
}

// Create a default instance
export const apiClient = new ApiClient();

// Helper function for backward compatibility
export async function makeApiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await apiClient.makeRequest<T>(endpoint, options);
  
  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  return response.data;
}
