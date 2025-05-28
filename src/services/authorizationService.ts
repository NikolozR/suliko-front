import { API_BASE_URL } from "@/constants/api";
import { LoginResponse } from "@/types/types.Auth";


interface LoginParams {
  phoneNumber: string;
  password: string;
}

export async function register({ phoneNumber, password }: LoginParams) {
  const endpoint = "/Auth/register-with-phone";
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNUmber: phoneNumber,
      password,
    }),
  });
  if (response.status === 200 || response.status === 500) {
    try {
      const loginResponse = await login({ phoneNumber, password });
      return loginResponse;
    } catch {
      throw new Error("Login Failed");
    }
  } else {
    throw new Error("Register failed");
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
      userName: phoneNumber,
      password,
    }),
  });
  if (response.status === 200) {
    const data = await response.json();
    return data;
  } else {
    throw new Error("Login failed");
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

export type { LoginParams };
