import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared";
import { getCurrencyCode, getCountryCode } from "@/shared/utils/domainUtils";


export interface CreatePaymentResponse {
  orderId: string;
  redirectUrl: string;
}




export interface FlittCheckoutRequest {
  amount: number;
  currency?: string;
  country?: string;
  orderId?: string;
  orderDescription?: string;
  acceptUrl?: string;
  cancelUrl?: string;
  server_callback_url?: string;
  saveCard?: boolean;
}

export interface FlittCheckoutResponse {
  orderId: string;
  checkoutUrl: string; 
  responseStatus: string;
  errorMessage?: string;
}






export async function createPayment(amount: number, currency?: string, country?: string): Promise<CreatePaymentResponse> {
  const endpoint = '/Payment/create';
  const { refreshToken, token } = useAuthStore.getState();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
  } else {
    throw new Error("No token found");
  }

  // Get base URL and locale-aware paths for callback URLs
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser ? window.location.origin : '';
  const path = isBrowser ? window.location.pathname : '';
  const localeFromPath = (() => {
    const first = path.split('/').filter(Boolean)[0];
    return ['en', 'ka', 'pl'].includes(first || '') ? `/${first}` : '';
  })();
  const acceptUrl = `${baseUrl}${localeFromPath}/payment/success`;
  const cancelUrl = `${baseUrl}${localeFromPath}/payment/cancel`;
  const callbackUrl = `${baseUrl}/api/payment/callback`;

  // Determine currency and country based on domain if not provided
  const paymentCurrency = currency || getCurrencyCode();
  const paymentCountry = country || getCountryCode();

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount,
      currency: paymentCurrency,
      country: paymentCountry,
      AcceptUrl: acceptUrl,
      CancelUrl: cancelUrl,
      CallbackUrl: callbackUrl,
    }),
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = await reaccessToken(refreshToken) as { token: string; refreshToken: string };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount,
          currency: paymentCurrency,
          country: paymentCountry,
          AcceptUrl: acceptUrl,
          CancelUrl: cancelUrl,
          CallbackUrl: callbackUrl,
        }),
      });
    } catch (error) {
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }


  if (response.status !== 200) {
    const errorData = await response.json();
    console.log(errorData);
    throw new Error(errorData.message || "Payment failed");
  } else {
    const data = await response.json();
    return data as CreatePaymentResponse;
  }
}





export async function createFlittPayment(
  amount: number,
  currency?: string,
  country?: string,
  saveCard?: boolean
): Promise<FlittCheckoutResponse> {
  const endpoint = "/Payment/flitt-create";
  const { refreshToken, token } = useAuthStore.getState();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
  } else {
    throw new Error("No token found");
  }

  const isBrowser = typeof window !== "undefined";
  const baseUrl = isBrowser ? window.location.origin : "";
  const path = isBrowser ? window.location.pathname : "";
  const localeFromPath = (() => {
    const first = path.split("/").filter(Boolean)[0];
    return ["en", "ka", "pl"].includes(first || "") ? `/${first}` : "";
  })();
  const acceptUrl = `${baseUrl}${localeFromPath}/payment/success`;
  const cancelUrl = `${baseUrl}${localeFromPath}/payment/cancel`;
  const server_callback_url = `https://content.api24.ge/api/payment/flitt-callback`;

  const paymentCurrency = currency || getCurrencyCode();
  const paymentCountry = country || getCountryCode();

  const body: FlittCheckoutRequest = {
    amount,
    currency: paymentCurrency,
    country: paymentCountry,
    orderDescription: `Suliko ${paymentCurrency} ${amount}`,
    acceptUrl,
    cancelUrl,
    server_callback_url,
    saveCard: saveCard ?? false,
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 401 && token && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as {
        token: string;
        refreshToken: string;
      };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      headers.set("Authorization", `Bearer ${newTokens.token}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch (error) {
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  if (response.status !== 200) {
    const errorData = await response.json();
    console.log(errorData);
    throw new Error(errorData.error || "Flitt payment failed");
  }

  const data = await response.json();
  return data as FlittCheckoutResponse;
}