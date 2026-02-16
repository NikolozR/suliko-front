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

/**
 * Get the currency symbol based on the domain
 * @returns '₾' for suliko.ge, '€' for suliko.io, '₾' as fallback
 */
export function getCurrencySymbol(): string {
  if (isSulikoIo()) {
    return '€';
  }
  // Default to GEL for suliko.ge and other domains
  return '₾';
}

/**
 * Get the currency code based on the domain
 * @returns 'EUR' for suliko.io, 'GEL' for suliko.ge, 'GEL' as fallback
 */
export function getCurrencyCode(): string {
  if (isSulikoIo()) {
    return 'EUR';
  }
  // Default to GEL for suliko.ge and other domains
  return 'GEL';
}

/**
 * Get the country code based on the domain
 * @returns 'LT' for suliko.io (Lithuania for EUR), 'GE' for suliko.ge (Georgia for GEL), 'GE' as fallback
 */
export function getCountryCode(): string {
  if (isSulikoIo()) {
    return 'LT'; // Lithuania for EUR payments
  }
  // Default to GE for suliko.ge and other domains
  return 'GE';
}

/**
 * Format a price with the appropriate currency symbol based on domain
 * @param price The numeric price value
 * @returns Formatted price string with currency symbol (e.g., "57 ₾" or "57 €")
 */
export function formatPrice(price: number | string): string {
  const currencySymbol = getCurrencySymbol();
  return `${price} ${currencySymbol}`;
}

/**
 * Extract numeric value from a price string and format it with the correct currency
 * @param priceString Price string that may contain currency symbol (e.g., "57 ₾" or "57")
 * @returns Formatted price string with correct currency symbol based on domain
 */
export function formatPriceFromString(priceString: string): string {
  // Extract numeric value (remove any existing currency symbols and whitespace)
  const numericValue = priceString.replace(/[₾€$€\s]/g, '').trim();
  return formatPrice(numericValue);
}

/**
 * Format balance/pages count smartly
 * If the value is a whole number (e.g., 59.0), display as "59"
 * If the value has decimal places (e.g., 59.4), display with decimals (e.g., "59.4")
 * @param balance The balance value to format
 * @returns Formatted balance string
 */
export function formatBalance(balance: number): string {
  // Round to 2 decimal places to handle floating point precision issues
  const rounded = Math.round(balance * 100) / 100;
  
  // Check if the rounded value is a whole number
  if (rounded % 1 === 0) {
    return rounded.toString();
  }
  
  // Otherwise, format with decimals and remove trailing zeros
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

