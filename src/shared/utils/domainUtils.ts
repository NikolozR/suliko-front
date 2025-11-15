/**
 * Get the current domain/hostname
 * @returns The current hostname (e.g., 'suliko.ge', 'suliko.io', 'localhost')
 */
export function getCurrentDomain(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hostname;
}

/**
 * Check if the current domain is suliko.ge
 * @returns true if the domain is suliko.ge
 */
export function isSulikoGe(): boolean {
  const domain = getCurrentDomain();
  return domain.includes('suliko.ge') || domain === 'suliko.ge';
}

/**
 * Check if the current domain is suliko.io
 * @returns true if the domain is suliko.io
 */
export function isSulikoIo(): boolean {
  const domain = getCurrentDomain();
  return domain.includes('suliko.io') || domain === 'suliko.io';
}

/**
 * Get the required verification method based on the domain
 * @returns 'phone' for suliko.ge, 'email' for suliko.io, null for other domains
 */
export function getRequiredVerificationMethod(): 'phone' | 'email' | null {
  if (isSulikoGe()) {
    return 'phone';
  }
  if (isSulikoIo()) {
    return 'email';
  }
  return null;
}

/**
 * Get the default locale based on the domain
 * @param hostname Optional hostname, defaults to current window location
 * @returns 'ka' for suliko.ge, 'en' for suliko.io, 'ka' as fallback
 */
export function getDefaultLocale(hostname?: string): 'ka' | 'en' {
  const domain = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  
  if (domain.includes('suliko.ge') || domain === 'suliko.ge') {
    return 'ka';
  }
  if (domain.includes('suliko.io') || domain === 'suliko.io') {
    return 'en';
  }
  // Default fallback
  return 'ka';
}

