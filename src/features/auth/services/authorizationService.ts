import { LoginResponse } from "@/features/auth/types/types.Auth";
import { apiClient, ApiClient } from "@/shared/lib/apiClient";


interface LoginParams {
  phoneNumber?: string;
  email?: string;
  password: string;
}

interface RegisterParams extends Omit<LoginParams, 'phoneNumber'> {
  phoneNumber?: string;
  firstname: string;
  lastname: string;
  email: string;
  subscribeNewsletter?: boolean;
}

export async function register({ phoneNumber, password, firstname, lastname, email }: Omit<RegisterParams, 'subscribeNewsletter'>) {
  try {
    // If phoneNumber is not provided or empty, use email in phoneNumber field
    const phoneNumberToSend = phoneNumber?.trim() || email;
    
    // TODO: add subscribeNewsletter to the request
    const response = await apiClient.post("/Auth/register-with-phone", {
      phoneNumber: phoneNumberToSend,
      password,
      firstname,
      lastname,
      email,
    });
    
    if (response.ok) {
      try {
        // Use the same logic for login - if no phoneNumber, use email
        const loginResponse = await login({ phoneNumber: phoneNumberToSend, password });
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
  email,
  password,
}: LoginParams): Promise<LoginResponse> {
  try {
    // Determine which identifier to use (phone or email)
    // The backend accepts email in the phoneNumber field, similar to registration
    const identifier = phoneNumber?.trim() || email?.trim();
    
    if (!identifier) {
      throw new Error("Either phone number or email must be provided");
    }

    // Send email or phone in the phoneNumber field - backend handles both
    const response = await apiClient.post("/Auth/login-with-phone", {
      phoneNumber: identifier,
      password,
    });
    
    if (response.ok) {
      return response.data as LoginResponse;
    } else {
      // Handle specific error cases
      if (response.status === 400 || response.status === 401) {
        // Update error message to be more generic (works for both phone and email)
        throw new Error("არასწორი მონაცემები ან პაროლი");
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

export async function sendVerificationCode(phoneNumber?: string, email?: string) {
  try {
    // Trim and validate inputs
    const trimmedPhone = phoneNumber?.trim();
    const trimmedEmail = email?.trim();
    
    // Check if at least one valid value is provided
    if (!trimmedPhone && !trimmedEmail) {
      throw new Error("Either phoneNumber or email must be provided");
    }
    
    // API accepts phoneNumber field which can contain either phone number or email
    // The API will detect the type and route accordingly
    const valueToSend = trimmedPhone || trimmedEmail;
    
    if (!valueToSend) {
      throw new Error("Either phoneNumber or email must be provided");
    }
    
    // Always send as phoneNumber field - API handles both phone and email
    const payload = {
      phoneNumber: valueToSend
    };
    
    // Debug: Log the payload being sent
    console.log("Sending verification code with payload:", payload);
    
    const response = await apiClient.post("/Auth/send-verification-code", payload);
    
    // Check if the API returned an error in the response data
    if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
      const apiResponse = response.data as { isSuccess: boolean; message?: string; code?: number };
      if (!apiResponse.isSuccess) {
        throw new Error(apiResponse.message || "Verification code sending failed");
      }
    }
    
    if (response.ok) {
      return response.data;
    } else {
      // Try to extract error message from response
      const errorMessage = response.data && typeof response.data === 'object' && 'message' in response.data
        ? (response.data as { message: string }).message
        : "Verification code sending failed";
      throw new Error(errorMessage);
    }
  } catch (error) {
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error("Verification code sending failed: " + errorMessage);
  }
}

// Export alias for convenience
export const sendCode = sendVerificationCode;

export async function recoverPassword(phoneNumber: string, newPassword: string) {
  try {
    const response = await apiClient.patch("/User/recover-password", {
      phoneNumber,
      newPassword,
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


