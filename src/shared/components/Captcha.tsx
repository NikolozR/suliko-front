"use client";

import { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  onError?: (error?: unknown) => void;
  theme?: 'light' | 'dark';
  size?: 'compact' | 'normal' | 'invisible';
  className?: string;
}

export default function Captcha({ 
  onVerify, 
  onError, 
  theme = 'light', 
  size = 'normal',
  className = '' 
}: CaptchaProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LfipPcrAAAAAObN-vCn-mlQA9S4DDWRmBnmenDJ';
  
  // Debug logging
  console.log('CAPTCHA Site Key:', siteKey);
  console.log('Environment check:', process.env.NODE_ENV);

  if (!siteKey) {
    console.error('reCAPTCHA site key is missing!');
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
        <p className="text-red-700 dark:text-red-300 text-sm">
          reCAPTCHA configuration error: Missing site key
        </p>
      </div>
    );
  }

  const handleChange = (token: string | null) => {
    onVerify(token);
  };

  const handleError = (error?: unknown) => {
    onError?.(error);
  };

  const resetCaptcha = () => {
    recaptchaRef.current?.reset();
  };

  return (
    <div className={`captcha-container ${className}`}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onErrored={handleError}
        onExpired={resetCaptcha}
        theme={theme}
        size={size}
      />
    </div>
  );
}
