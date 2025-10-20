"use client";

import { useEffect } from 'react';

interface MetaPixelProps {
  pixelId: string;
}

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Facebook Pixel using a simpler approach
    if (!window.fbq) {
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.async = true;
      document.head.appendChild(script);

      // Initialize fbq function
      window.fbq = function(...args: unknown[]) {
        // This will be replaced by the actual Facebook Pixel code
        console.log('Facebook Pixel:', args);
      };
    }

    // Initialize the pixel with your ID
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');

    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, [pixelId]);

  return null;
}

// Utility functions for tracking events
export const trackRegistration = (userData?: {
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('track', 'CompleteRegistration', {
    content_name: 'User Registration',
    content_category: 'User Signup',
    ...userData
  });
};

export const trackRegistrationStart = () => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('track', 'InitiateCheckout', {
    content_name: 'Registration Form Started',
    content_category: 'User Signup'
  });
};

export const trackRegistrationComplete = (userData?: {
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('track', 'Purchase', {
    content_name: 'User Registration Completed',
    content_category: 'User Signup',
    value: 0, // Free registration
    currency: 'GEL',
    ...userData
  });
};
