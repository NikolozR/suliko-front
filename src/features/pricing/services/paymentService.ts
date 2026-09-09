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
  isSubscription?: boolean;
  planName?: string;
}

export interface FlittCheckoutResponse {
  orderId: string;
  checkoutUrl: string;
  responseStatus: string;
  errorMessage?: string;
}

export interface BogCheckoutRequest {
  amount: number;
  currency?: string;
  orderDescription?: string;
  language?: string;
}

export interface BogCheckoutResponse {
  orderId: string;
  redirectUrl: string;
}

export interface BogPaymentStatus {
  orderId: string;
  /** "created" | "pending" | "succeeded" | "failed" | "refunded" | "unknown" */
  status: string;
  amount: number;
  currency: string;
}

/**
 * Starts a Bank of Georgia checkout and returns where to send the customer.
 *
 * Only the amount travels from here: the merchant credentials, callback URL and
 * return URLs all live on the server, and the balance is credited from BOG's
 * signed callback rather than from anything the browser reports back.
 */
export async function createBogPayment(
  amount: number,
  options?: { currency?: string; orderDescription?: string }
): Promise<BogCheckoutResponse> {
  const currency = options?.currency ?? getCurrencyCode();

  const body: BogCheckoutRequest = {
    amount,
    currency,
    orderDescription: options?.orderDescription ?? `Suliko ${amount} ${currency}`,
    // BOG's hosted page speaks Georgian and English; everyone else gets English.
    language: getCurrentLocale() === "ka" ? "ka" : "en",
  };

  return authedJson<BogCheckoutResponse>("/Payment/bog-create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Reads back the status of one of the caller's own orders. The success page polls
 * this because the customer usually returns before BOG's callback lands.
 */
export async function getBogPaymentStatus(orderId: string): Promise<BogPaymentStatus> {
  return authedJson<BogPaymentStatus>(`/Payment/bog-status/${encodeURIComponent(orderId)}`);
}

/** First path segment when it is one of our locales, so BOG's page opens in the same language. */
function getCurrentLocale(): string {
  if (typeof window === "undefined") return "ka";
  const first = window.location.pathname.split("/").filter(Boolean)[0];
  return ["en", "ka", "pl"].includes(first || "") ? (first as string) : "ka";
}

/**
 * Calls the API with the stored token, retrying once against a refreshed one.
 * Shared by the BOG calls so the retry is written in a single place.
 */
async function authedJson<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const { refreshToken, token } = useAuthStore.getState();
  if (!token) throw new Error("No token found");

  const send = (bearer: string) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
    });

  let response = await send(token);

  if (response.status === 401 && refreshToken) {
    try {
      const newTokens = (await reaccessToken(refreshToken)) as {
        token: string;
        refreshToken: string;
      };
      const { setToken, setRefreshToken } = useAuthStore.getState();
      setToken(newTokens.token);
      setRefreshToken(newTokens.refreshToken);
      response = await send(newTokens.token);
    } catch (error) {
      useAuthStore.getState().reset();
      throw new Error("Failed to refresh token " + error);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Payment failed");
  }

  return (await response.json()) as T;
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

export async function createFlittSubscription(
  planName: string,
  amount: number,
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

  const paymentCurrency = getCurrencyCode();
  const paymentCountry = getCountryCode();

  const body: FlittCheckoutRequest = {
    amount,
    currency: paymentCurrency,
    country: paymentCountry,
    orderDescription: `Suliko ${planName} subscription`,
    acceptUrl,
    cancelUrl,
    server_callback_url,
    isSubscription: true,
    planName,
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
    throw new Error(errorData.error || "Subscription checkout failed");
  }

  const data = await response.json();
  return data as FlittCheckoutResponse;
}