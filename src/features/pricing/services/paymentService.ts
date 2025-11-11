import { reaccessToken, useAuthStore } from "@/features/auth";
import { API_BASE_URL } from "@/shared";


export interface CreatePaymentResponse {
  orderId: string;
  redirectUrl: string;
}


export async function createPayment(amount: number, currency: string, country: string): Promise<CreatePaymentResponse> {
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
  
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
      headers,
      body: JSON.stringify({
        amount,
        currency,
        country,
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
            currency,
            country,
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