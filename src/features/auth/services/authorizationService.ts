import { LoginResponse } from "@/features/auth/types/types.Auth";
import { apiClient, ApiClient } from "@/shared/lib/apiClient";


interface LoginParams {
  phoneNumber: string;
  password: string;
}

interface RegisterParams extends LoginParams {
  firstname: string;
  lastname: string;
  subscribeNewsletter?: boolean;
}

export async function register({ phoneNumber, password, firstname, lastname, subscribeNewsletter: _ }: RegisterParams) {
  try {
    // TODO: add subscribeNewsletter to the request
    const response = await apiClient.post("/Auth/register-with-phone", {
      phoneNumber,
      password,
      firstname,
      lastname,
    });
    
    if (response.ok) {
      try {
        const loginResponse = await login({ phoneNumber, password });
        return loginResponse;
      } catch {
        throw new Error("რეგისტრაცია წარმატებულია, მაგრამ შესვლა ვერ მოხერხდა");
      }
    } else {
      // Handle specific error cases
      if (response.status === 400 || response.status === 409) {
        throw new Error("ეს ტელეფონის ნომერი უკვე რეგისტრირებულია");
      } else if (response.status === 422) {
        throw new Error("არასწორი მონაცემების ფორმატი");
      } else if (response.status === 500) {
        throw new Error("ეს ტელეფონის ნომერი უკვე რეგისტრირებულია");
      } else {
        throw new Error("რეგისტრაცია ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით");
      }
    }
  } catch (error) {
    // Handle CORS and other errors
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export async function login({
  phoneNumber,
  password,
}: LoginParams): Promise<LoginResponse> {
  try {
    const response = await apiClient.post("/Auth/login-with-phone", {
      phoneNumber,
      password,
    });
    
    if (response.ok) {
      return response.data as LoginResponse;
    } else {
      // Handle specific error cases
      if (response.status === 400 || response.status === 401) {
        throw new Error("არასწორი ტელეფონის ნომერი ან პაროლი");
      } else if (response.status === 404) {
        throw new Error("მომხმარებელი ვერ მოიძებნა. გთხოვთ ჯერ გაიაროთ რეგისტრაცია");
      } else if (response.status === 422) {
        throw new Error("არასწორი მონაცემების ფორმატი");
      } else if (response.status === 500) {
        throw new Error("სერვერის შეცდომა. გთხოვთ სცადოთ მოგვიანებით");
      } else {
        throw new Error("შესვლა ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით");
      }
    }
  } catch (error) {
    // Handle CORS and other errors
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export async function reaccessToken(refreshToken: string) {
  try {
    const response = await apiClient.post("/Auth/refresh-token", {
      refreshToken,
    });
    
    if (response.ok) {
      return response.data;
    } else {
      throw new Error("Refresh token failed");
    }
  } catch (error) {
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error("Refresh token failed: " + errorMessage);
  }
}

export async function sendVerificationCode(phoneNumber: string) {
  try {
    const response = await apiClient.post("/Auth/send-verification-code", {
      phoneNumber,
    });
    
    if (response.ok) {
      return response.data;
    } else {
      throw new Error("Verification code sending failed");
    }
  } catch (error) {
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error("Verification code sending failed: " + errorMessage);
  }
}

// Export alias for convenience
export const sendCode = sendVerificationCode;

export async function recoverPassword(phoneNumber: string) {
  try {
    const response = await apiClient.post("/User/recover-password", {
      phoneNumber,
    });
    return response.data;
  } catch (error) {
    // Handle CORS and other errors
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export async function validateRecoveryCode(phoneNumber: string, code: string) {
  try {
    const response = await apiClient.post("/User/validate-recovery-code", {
      phoneNumber,
      code,
    });
    return response.data;
  } catch (error) {
    // Handle CORS and other errors
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export async function resetPassword(phoneNumber: string, newPassword: string, token: string) {
  try {
    const response = await apiClient.post("/User/reset-password", {
      phoneNumber,
      newPassword,
      token,
    });
    return response.data;
  } catch (error) {
    // Handle CORS and other errors
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export type { LoginParams, RegisterParams };


