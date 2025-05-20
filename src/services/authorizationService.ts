const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface LoginParams {
  userName: string;
  password: string;
}

export async function login({ userName, password }: LoginParams) {
  console.log(userName);
  const endpoint = "/Auth/login";
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // TODO: remove this after testing, when mobile + password endpoint is ready
    body: JSON.stringify({
      userName: "nika.rusishvili.95@gmail.com",
      password,
    }),
  });
  if (response.status === 200) {
    const data = await response.json();
    console.log(data);
    return data;
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
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
