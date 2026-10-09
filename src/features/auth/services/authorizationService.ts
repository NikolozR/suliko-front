import { LoginResponse } from "@/features/auth/types/types.Auth";
import { apiClient, ApiClient } from "@/shared/lib/apiClient";
import {
  WEB_SESSIONS,
  SESSION_COOKIE_MARKER,
  refreshWebSession,
  sessionPost,
} from "@/features/auth/lib/webSession";


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
  referralCode?: string;
  /** The code sent to the phone (or, for email sign-ups, the email) being registered. */
  verificationCode: string;
}

export async function register({ phoneNumber, password, firstname, lastname, email, referralCode, verificationCode }: Omit<RegisterParams, 'subscribeNewsletter'>) {
  const phoneNumberToSend = phoneNumber?.trim() || email;

  let response;
  try {
    response = await apiClient.post("/Auth/register-with-phone", {
      phoneNumber: phoneNumberToSend,
      password,
      firstname,
      lastname,
      email,
      verificationCode,
      ...(referralCode?.trim() ? { referralCode: referralCode.trim() } : {}),
    });
  } catch (error) {
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }

  if (response.ok) {
    // Auto-login after successful registration
    try {
      const loginResponse = await login({ phoneNumber: phoneNumberToSend, password });
      return loginResponse;
    } catch {
      throw new Error("REGISTRATION_SUCCESS_LOGIN_FAILED");
    }
  }

  if (response.status === 409) {
    throw new Error("მომხმარებელი უკვე რეგისტრირებულია");
  } else if (response.status === 400) {
    const serverMessage = response.data && typeof response.data === 'object' && 'message' in response.data
      ? (response.data as { message: string }).message
      : null;
    throw new Error(serverMessage || "მომხმარებელი უკვე რეგისტრირებულია");
  } else if (response.status === 422) {
    throw new Error("არასწორი მონაცემების ფორმატი");
  } else if (response.status === 500) {
    throw new Error("სერვერის შეცდომა. გთხოვთ სცადოთ მოგვიანებით");
  } else {
    throw new Error("რეგისტრაცია ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით");
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

    // Send email or phone in the phoneNumber field - backend handles both.
    // With web sessions, through this site's server, which keeps the refresh
    // token in an HttpOnly cookie; the answers are the backend's either way.
    const response = WEB_SESSIONS
      ? await sessionPost("login", { phoneNumber: identifier, password })
      : await apiClient.post("/Auth/login-with-phone", {
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
  // The marker means the real token is in this site's cookie. Anything else is
  // a token from before web sessions, still refreshed the old way.
  if (WEB_SESSIONS && refreshToken === SESSION_COOKIE_MARKER) {
    return refreshWebSession();
  }
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

/**
 * Asks the API whether `code` is the one it sent to `identifier` (phone or email). The code is
 * never sent to the browser; register and recover-password check it again on the server.
 */
export async function verifyCode(identifier: string, code: string): Promise<boolean> {
  try {
    const response = await apiClient.post("/Auth/verify-code", {
      phoneNumber: identifier.trim(),
      code: code.trim(),
    });
    const data = response.data as { isValid?: boolean } | undefined;
    return response.ok && data?.isValid === true;
  } catch (error) {
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export async function checkUserExists(identifier: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(identifier.trim());
    const response = await apiClient.get(`/Auth/check-user-exists?identifier=${encoded}`);

    if (response.ok) {
      const data = response.data as { isRegistered?: boolean; exists?: boolean };
      return data.isRegistered === true || data.exists === true;
    }

    if (response.status === 404) {
      return false;
    }

    throw new Error("Failed to check if user exists");
  } catch (error) {
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export async function recoverPassword(identifier: string, newPassword: string, verificationCode: string) {
  try {
    const response = await apiClient.patch("/User/recover-password", {
      phoneNumber: identifier,
      newPassword,
      verificationCode,
    });

    // Check if the API returned an error in the response data
    if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
      const apiResponse = response.data as { isSuccess: boolean; message?: string };
      if (!apiResponse.isSuccess) {
        throw new Error(apiResponse.message || "Password recovery failed");
      }
    }

    if (response.ok) {
      return response.data;
    }

    const errorMessage = typeof response.data === 'string' && response.data
      ? response.data
      : response.data && typeof response.data === 'object' && 'message' in response.data
        ? (response.data as { message: string }).message
        : "Password recovery failed";
    throw new Error(errorMessage);
  } catch (error) {
    // Handle CORS and other errors
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}


export async function loginWithGoogle(idToken: string, referralCode?: string): Promise<LoginResponse> {
  try {
    // The referral code only matters when this Google account signs up for the first time.
    const query = referralCode?.trim() ? `?referralCode=${encodeURIComponent(referralCode.trim())}` : "";
    const response = WEB_SESSIONS
      ? await sessionPost("google", { idToken, referralCode: referralCode?.trim() || null })
      : await apiClient.post<LoginResponse>(`/Auth/login-with-google${query}`, idToken);
    if (response.ok) {
      return response.data as LoginResponse;
    } else {
      throw new Error("Google login failed");
    }
  } catch (error) {
    const errorMessage = ApiClient.handleApiError(error);
    throw new Error(errorMessage);
  }
}

export type { LoginParams, RegisterParams };


