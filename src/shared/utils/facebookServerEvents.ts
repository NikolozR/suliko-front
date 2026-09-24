/**
 * Send server-side events to the Meta Conversions API, via our own /api route.
 *
 * Nothing identifying is hashed here: raw email and phone are posted to our own
 * same-origin endpoint, which hashes them with SHA-256 before anything reaches
 * Meta. Hashing in the browser was previously attempted with btoa(), which is
 * reversible base64 rather than a hash, so it protected nothing and broke
 * matching at the same time.
 */

interface UserData {
  email?: string
  phone?: string
  /** Facebook Click ID (fbc) — Meta's attribution id, not user data. */
  clickId?: string
  /** Facebook Browser ID (fbp) — set by the pixel's own cookie. */
  browserId?: string
  externalId?: string
  facebookLoginId?: string
}

interface CustomData {
  currency?: string
  value?: string
  contentName?: string
  contentCategory?: string
}

interface ServerEventPayload {
  eventName: string
  userData: UserData
  customData?: CustomData
  /**
   * Only for manual debugging against Meta's Test Events tool. Events carrying a
   * test code are NOT counted as conversions, so this must stay unset in any
   * real user flow.
   */
  testEventCode?: string
}

/**
 * Post an event to our Conversions API route.
 * @returns true if the route accepted and forwarded the event.
 */
export async function sendFacebookServerEvent(payload: ServerEventPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/facebook-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Facebook server event failed:', errorData)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Facebook server event:', error)
    return false
  }
}

/**
 * Track a completed registration.
 *
 * CompleteRegistration rather than Purchase: a free signup is not revenue, and
 * emitting Purchase with value 0 corrupted value-based optimisation and ROAS.
 */
export async function trackRegistrationServerEvent(userData: UserData): Promise<boolean> {
  return sendFacebookServerEvent({
    eventName: 'CompleteRegistration',
    userData,
    customData: {
      contentName: 'User Registration Completed',
      contentCategory: 'User Signup',
    },
  })
}

/** Track a visitor starting the registration form. */
export async function trackRegistrationStartServerEvent(userData?: UserData): Promise<boolean> {
  return sendFacebookServerEvent({
    eventName: 'InitiateCheckout',
    userData: userData || {},
    customData: {
      contentName: 'Registration Form Started',
      contentCategory: 'User Signup',
    },
  })
}
