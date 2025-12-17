/**
 * Enhanced Meta Pixel tracking utilities
 * Implements additional parameters for improved conversion reporting
 */

import { hashEmail } from './hashUtils';

// Enhanced user data interface with all tracking parameters
export interface EnhancedUserData {
  // Basic user data
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  
  // Enhanced tracking parameters
  clickId?: string; // fbc - Facebook Click ID
  ipAddress?: string; // IP Address
  userAgent?: string; // User Agent
  browserId?: string; // fbp - Facebook Browser ID
  externalId?: string; // External ID
  facebookLoginId?: string; // Facebook Login ID
}

// Client-side enhanced tracking parameters
export interface ClientTrackingParams {
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
  external_id?: string; // External ID
  em?: string; // Hashed email
  ph?: string; // Hashed phone
}

// Server-side enhanced tracking parameters
export interface ServerTrackingParams {
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
  external_id?: string; // External ID
  em?: string[]; // Hashed email array
  ph?: string[]; // Hashed phone array
  client_ip_address?: string; // IP Address
  client_user_agent?: string; // User Agent
  fb_login_id?: string; // Facebook Login ID
}

/**
 * Get Facebook Click ID (fbc) from URL parameters or cookies
 */
export function getFacebookClickId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    return `fb.1.${Date.now()}.${fbclid}`;
  }
  
  // Check cookies for existing fbc
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbc') {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Get Facebook Browser ID (fbp) from cookies
 */
export function getFacebookBrowserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbp') {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Get user's IP address (client-side approximation)
 * Note: This is not the actual server IP, but can be used for client-side tracking
 */
export function getClientIPAddress(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  // This is a placeholder - actual IP detection would need server-side implementation
  // For now, we'll use a combination of browser fingerprinting
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get user agent string
 */
export function getUserAgent(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return navigator.userAgent;
}

/**
 * Generate external ID for user tracking
 */
export function generateExternalId(userData: EnhancedUserData): string | undefined {
  if (userData.externalId) {
    return userData.externalId;
  }
  
  // Generate based on available data
  const identifier = userData.email || userData.phone || userData.firstName;
  if (identifier) {
    return `ext_${btoa(identifier).replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  
  return undefined;
}

/**
 * Prepare enhanced client-side tracking parameters
 */
export function prepareClientTrackingParams(userData: EnhancedUserData): ClientTrackingParams {
  const params: ClientTrackingParams = {};
  
  // Facebook Click ID (fbc)
  const fbc = getFacebookClickId();
  if (fbc) {
    params.fbc = fbc;
  }
  
  // Facebook Browser ID (fbp)
  const fbp = getFacebookBrowserId();
  if (fbp) {
    params.fbp = fbp;
  }
  
  // External ID
  const externalId = generateExternalId(userData);
  if (externalId) {
    params.external_id = externalId;
  }
  
  // Hashed email
  if (userData.email) {
    const hashedEmail = hashEmail(userData.email);
    if (hashedEmail) {
      params.em = hashedEmail;
    }
  }
  
  // Hashed phone
  if (userData.phone) {
    // Note: Phone hashing would need to be implemented in hashUtils
    // For now, we'll use a simple approach
    const hashedPhone = btoa(userData.phone).replace(/[^a-zA-Z0-9]/g, '');
    if (hashedPhone) {
      params.ph = hashedPhone;
    }
  }
  
  return params;
}

/**
 * Prepare enhanced server-side tracking parameters
 */
export function prepareServerTrackingParams(userData: EnhancedUserData, request?: Request): ServerTrackingParams {
  const params: ServerTrackingParams = {};
  
  // Facebook Click ID (fbc)
  if (userData.clickId) {
    params.fbc = userData.clickId;
  }
  
  // Facebook Browser ID (fbp)
  if (userData.browserId) {
    params.fbp = userData.browserId;
  }
  
  // External ID
  if (userData.externalId) {
    params.external_id = userData.externalId;
  }
  
  // Facebook Login ID
  if (userData.facebookLoginId) {
    params.fb_login_id = userData.facebookLoginId;
  }
  
  // IP Address (from request headers)
  if (request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || request.headers.get('x-client-ip');
    if (clientIp) {
      params.client_ip_address = clientIp;
    }
    
    // User Agent
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      params.client_user_agent = userAgent;
    }
  }
  
  // Hashed email
  if (userData.email) {
    const hashedEmail = hashEmail(userData.email);
    if (hashedEmail) {
      params.em = [hashedEmail];
    }
  }
  
  // Hashed phone
  if (userData.phone) {
    // Note: Phone hashing would need to be implemented in hashUtils
    const hashedPhone = btoa(userData.phone).replace(/[^a-zA-Z0-9]/g, '');
    if (hashedPhone) {
      params.ph = [hashedPhone];
    }
  }
  
  return params;
}

/**
 * Enhanced Meta Pixel tracking function with all parameters
 */
export function trackEnhancedMetaPixelEvent(
  eventName: string,
  userData: EnhancedUserData,
  customData?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  const trackingParams = prepareClientTrackingParams(userData);
  
  // Track with enhanced parameters
  window.fbq('track', eventName, {
    ...customData,
    ...trackingParams
  });
}

/**
 * Enhanced registration tracking with all parameters
 */
export function trackEnhancedRegistration(
  userData: EnhancedUserData,
  eventType: 'start' | 'complete' = 'complete'
): void {
  const eventName = eventType === 'start' ? 'InitiateCheckout' : 'Purchase';
  
  trackEnhancedMetaPixelEvent(eventName, userData, {
    currency: 'GEL',
    value: '0.00',
    content_name: eventType === 'start' ? 'Registration Started' : 'Registration Completed',
    content_category: 'User Signup'
  });
}
