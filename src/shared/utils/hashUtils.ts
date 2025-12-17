import crypto from 'crypto';

/**
 * Hash data using SHA-256 as required by Facebook Conversions API
 * @param data - The data to hash
 * @returns Hashed string in lowercase
 */
export function hashData(data: string): string {
  if (!data || data.trim() === '') {
    return '';
  }
  
  return crypto
    .createHash('sha256')
    .update(data.toLowerCase().trim())
    .digest('hex');
}

/**
 * Hash email address for Facebook Conversions API
 * @param email - Email address to hash
 * @returns Hashed email or empty string if invalid
 */
export function hashEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '';
  }
  return hashData(email);
}

/**
 * Hash phone number for Facebook Conversions API
 * @param phone - Phone number to hash
 * @returns Hashed phone or empty string if invalid
 */
export function hashPhone(phone: string): string {
  if (!phone || phone.trim() === '') {
    return '';
  }
  
  // Remove all non-digit characters for consistent hashing
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming Georgia +995)
  const phoneWithCountryCode = cleanPhone.startsWith('995') 
    ? cleanPhone 
    : `995${cleanPhone}`;
    
  return hashData(phoneWithCountryCode);
}

/**
 * Generate current timestamp for Facebook events
 * @returns Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
