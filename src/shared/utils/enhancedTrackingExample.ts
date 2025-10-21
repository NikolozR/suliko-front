/**
 * Example implementation of enhanced Meta Pixel tracking
 * This shows how to use the enhanced parameters for better conversion reporting
 */

import { 
  trackEnhancedMetaPixelEvent, 
  trackEnhancedRegistration,
  EnhancedUserData,
  prepareClientTrackingParams 
} from './enhancedMetaPixel';
import { trackEnhancedRegistrationServerEvent } from './facebookServerEvents';

/**
 * Example: Enhanced registration tracking with all parameters
 * This demonstrates how to collect and send all the enhanced tracking data
 */
export async function exampleEnhancedRegistrationTracking(
  userData: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  }
): Promise<boolean> {
  
  // Prepare enhanced user data with all tracking parameters
  const enhancedUserData: EnhancedUserData = {
    // Basic user data
    email: userData.email,
    phone: userData.phone,
    firstName: userData.firstName,
    lastName: userData.lastName,
    
    // Enhanced tracking parameters (these would be collected from the client)
    clickId: getFacebookClickIdFromClient(), // fbc - Facebook Click ID
    browserId: getFacebookBrowserIdFromClient(), // fbp - Facebook Browser ID
    externalId: generateExternalId(userData), // External ID
    facebookLoginId: getFacebookLoginIdFromClient(), // Facebook Login ID (if available)
  };

  try {
    // 1. Client-side tracking with enhanced parameters
    trackEnhancedRegistration(enhancedUserData, 'complete');
    
    // 2. Server-side tracking with enhanced parameters
    const serverSuccess = await trackEnhancedRegistrationServerEvent(enhancedUserData, 'TEST6827');
    
    console.log('Enhanced tracking completed:', {
      clientSide: 'tracked',
      serverSide: serverSuccess ? 'success' : 'failed',
      parameters: {
        email: !!enhancedUserData.email,
        phone: !!enhancedUserData.phone,
        clickId: !!enhancedUserData.clickId,
        browserId: !!enhancedUserData.browserId,
        externalId: !!enhancedUserData.externalId,
        facebookLoginId: !!enhancedUserData.facebookLoginId
      }
    });
    
    return serverSuccess;
    
  } catch (error) {
    console.error('Enhanced tracking failed:', error);
    return false;
  }
}

/**
 * Example: Registration start tracking with enhanced parameters
 */
export function exampleRegistrationStartTracking(): void {
  const enhancedUserData: EnhancedUserData = {
    clickId: getFacebookClickIdFromClient(),
    browserId: getFacebookBrowserIdFromClient(),
    externalId: generateExternalId({}),
  };

  // Track registration start with enhanced parameters
  trackEnhancedRegistration(enhancedUserData, 'start');
}

/**
 * Helper functions to collect client-side data
 * These would typically be called from your registration components
 */

function getFacebookClickIdFromClient(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  // Check URL parameters for fbclid
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

function getFacebookBrowserIdFromClient(): string | undefined {
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

function generateExternalId(userData: any): string {
  const identifier = userData.email || userData.phone || userData.firstName;
  if (identifier) {
    return `ext_${btoa(identifier).replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getFacebookLoginIdFromClient(): string | undefined {
  // This would be available if user logged in with Facebook
  // Implementation depends on your Facebook Login integration
  return undefined;
}

/**
 * Example: How to use in a React component
 */
export function useEnhancedTracking() {
  const trackRegistrationComplete = async (userData: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  }) => {
    return await exampleEnhancedRegistrationTracking(userData);
  };

  const trackRegistrationStart = () => {
    exampleRegistrationStartTracking();
  };

  return {
    trackRegistrationComplete,
    trackRegistrationStart
  };
}
