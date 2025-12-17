/**
 * Send server-side events to Facebook Conversions API
 */

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  // Enhanced tracking parameters
  clickId?: string; // fbc - Facebook Click ID
  browserId?: string; // fbp - Facebook Browser ID
  externalId?: string; // External ID
  facebookLoginId?: string; // Facebook Login ID
}

interface CustomData {
  currency?: string;
  value?: string;
  contentName?: string;
  contentCategory?: string;
}

interface ServerEventPayload {
  eventName: string;
  userData: UserData;
  customData?: CustomData;
  testEventCode?: string;
}

/**
 * Send a server-side event to Facebook Conversions API
 * @param payload - Event payload containing event name, user data, and custom data
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function sendFacebookServerEvent(payload: ServerEventPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/facebook-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Facebook server event failed:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('Facebook server event sent successfully:', result.eventSent);
    return true;

  } catch (error) {
    console.error('Error sending Facebook server event:', error);
    return false;
  }
}

/**
 * Track user registration completion with server-side event
 * @param userData - User registration data
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function trackRegistrationServerEvent(userData: UserData, testEventCode?: string): Promise<boolean> {
  return sendFacebookServerEvent({
    eventName: 'Purchase', // Using Purchase event for completed registrations
    userData,
    customData: {
      currency: 'GEL',
      value: '0.00', // Free registration
      contentName: 'User Registration Completed',
      contentCategory: 'User Signup'
    },
    testEventCode
  });
}

/**
 * Enhanced registration tracking with all available parameters
 * @param userData - Enhanced user data with tracking parameters
 * @param testEventCode - Optional test event code
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function trackEnhancedRegistrationServerEvent(
  userData: UserData, 
  testEventCode?: string
): Promise<boolean> {
  return sendFacebookServerEvent({
    eventName: 'Purchase',
    userData,
    customData: {
      currency: 'GEL',
      value: '0.00',
      contentName: 'Enhanced User Registration Completed',
      contentCategory: 'User Signup'
    },
    testEventCode
  });
}

/**
 * Track user registration start with server-side event
 * @param userData - User data (minimal for start event)
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function trackRegistrationStartServerEvent(userData?: UserData, testEventCode?: string): Promise<boolean> {
  return sendFacebookServerEvent({
    eventName: 'InitiateCheckout', // Using InitiateCheckout for registration start
    userData: userData || {},
    customData: {
      currency: 'GEL',
      value: '0.00',
      contentName: 'Registration Form Started',
      contentCategory: 'User Signup'
    },
    testEventCode
  });
}
