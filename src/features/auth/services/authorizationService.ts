import { API_BASE_URL } from "@/shared/constants/api";
import { LoginResponse } from "@/features/auth/types/types.Auth";


interface LoginParams {
  phoneNumber: string;
  password: string;
}

interface RegisterParams extends LoginParams {
  firstname: string;
  lastname: string;
}

export async function register({ phoneNumber, password, firstname, lastname }: RegisterParams) {
  const endpoint = "/Auth/register-with-phone";
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
      password,
      firstname,
      lastname,
    }),
  });
  
  if (response.status === 200) {
    try {
      const loginResponse = await login({ phoneNumber, password });
      return loginResponse;
    } catch {
      throw new Error("რეგისტრაცია წარმატებულია, მაგრამ შესვლა ვერ მოხერხდა");
    }
  } else if (response.status === 400) {
    const errorData = await response.json().catch(() => null);
    if (errorData && errorData.message) {
      throw new Error(errorData.message);
    }
    throw new Error("ეს ტელეფონის ნომერი უკვე რეგისტრირებულია");
  } else if (response.status === 409) {
    throw new Error("ეს ტელეფონის ნომერი უკვე რეგისტრირებულია");
  } else if (response.status === 422) {
    throw new Error("არასწორი მონაცემების ფორმატი");
  } else if (response.status === 500) {
    throw new Error("ეს ტელეფონის ნომერი უკვე რეგისტრირებულია");
  } else {
    throw new Error("რეგისტრაცია ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით");
  }
}

export async function login({
  phoneNumber,
  password,
}: LoginParams): Promise<LoginResponse> {
  const endpoint = "/Auth/login-with-phone";
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
      password,
    }),
  });
  
  if (response.status === 200) {
    const data = await response.json();
    return data;
  } else if (response.status === 400 || response.status === 401) {
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

export async function reaccessToken(refreshToken: string) {
  const endpoint = "/Auth/refresh-token";
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });
    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      throw new Error("Refresh token failed");
    }
  } catch (error) {
    throw new Error("Refresh token failed " + error);
  }
}

export async function sendVerificationCode(phoneNumber: string) {
  const endpoint = "/Auth/send-verification-code";
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber,
    }),
  });
  if (response.status === 200) {
    const data = await response.json();
    return data;
  } else {
    throw new Error("Verification code sending failed");
  }
}

// Export alias for convenience
export const sendCode = sendVerificationCode;

export type { LoginParams, RegisterParams };


