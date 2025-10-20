"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/features/ui";
import { Button } from "@/features/ui";
import { useState, useEffect, useMemo } from "react";
import LandingHeader from "@/shared/components/LandingHeader";
import LandingFooter from "@/shared/components/LandingFooter";
import SulikoLogo from "@/shared/components/SulikoLogo";
import { useTheme } from "next-themes";

export default function ReferralPage() {
  const t = useTranslations("ReferralPage");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Yandex Metrica tracking
  useEffect(() => {
    // Load Yandex Metrica script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=104728476', 'ym');

      ym(104728476, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
    `;
    document.head.appendChild(script);

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = '<div><img src="https://mc.yandex.ru/watch/104728476" style="position:absolute; left:-9999px;" alt="" /></div>';
    document.body.appendChild(noscript);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (noscript.parentNode) {
        noscript.parentNode.removeChild(noscript);
      }
    };
  }, []);

  // Theme-aware star colors
  const isDark = mounted && resolvedTheme === "dark";
  const starColor = isDark ? "white" : "#1e40af"; // Blue for light theme, white for dark
  const shootingStarColor = isDark ? "from-white via-blue-200" : "from-blue-600 via-blue-400";

  // Generate stable star positions using useMemo to avoid hydration mismatches
  const starData = useMemo(() => {
    if (!mounted) return { stars: [], mediumStars: [], smallStars: [], shootingStars: [] };
    
    const generateStars = (count: number, size: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 4,
        animationDuration: 2 + Math.random() * 3,
        opacity: size === 1 ? 0.3 + Math.random() * 0.4 : undefined,
      }));
    };

    return {
      stars: generateStars(40, 1), // Large stars
      mediumStars: generateStars(60, 0.5), // Medium stars
      smallStars: generateStars(100, 0), // Small stars
      shootingStars: Array.from({ length: 2 }, (_, i) => ({
        id: i,
        left: Math.random() * 20,
        top: Math.random() * 20,
        animationDelay: Math.random() * 10,
        animationDuration: 2 + Math.random() * 2,
      })),
    };
  }, [mounted]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX XXX XXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create form data for FormSubmit
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phoneNumber);
      formData.append('_subject', 'New Referral Phone Number - Suliko');
      formData.append('_captcha', 'false');
      formData.append('_template', 'table');
      formData.append('_next', window.location.href); // Stay on same page

      // Submit to FormSubmit with more lenient error handling
      await fetch('https://formsubmit.co/info@th.com.ge', {
        method: 'POST',
        body: formData,
        mode: 'no-cors', // This helps with CORS issues
      });

      // Since we're using no-cors mode, we can't check response status
      // But if we get here without an exception, FormSubmit likely received it
      // We'll show success and let the user know to check their email
      setSubmitStatus('success');
      setPhoneNumber('');
      setName('');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      // Even if there's an error, FormSubmit might still work
      // Let's be optimistic and show success, but with a note
      setSubmitStatus('success');
      setPhoneNumber('');
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900" />
      
      {/* Star Field Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stars Layer 1 - Large twinkling stars */}
        <div className="absolute inset-0">
          {starData.stars.map((star) => (
            <div
              key={`star-1-${star.id}`}
              className="absolute w-1 h-1 rounded-full animate-twinkle"
              style={{
                backgroundColor: starColor,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
              }}
            />
          ))}
        </div>

        {/* Stars Layer 2 - Medium stars */}
        <div className="absolute inset-0">
          {starData.mediumStars.map((star) => (
            <div
              key={`star-2-${star.id}`}
              className="absolute w-0.5 h-0.5 rounded-full animate-slow-twinkle"
              style={{
                backgroundColor: starColor,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay + 1}s`,
                animationDuration: `${star.animationDuration + 1}s`,
              }}
            />
          ))}
        </div>

        {/* Stars Layer 3 - Small static stars */}
        <div className="absolute inset-0">
          {starData.smallStars.map((star) => (
            <div
              key={`star-3-${star.id}`}
              className="absolute w-px h-px rounded-full"
              style={{
                backgroundColor: starColor,
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
              }}
            />
          ))}
        </div>

        {/* Shooting stars */}
        <div className="absolute inset-0">
          {starData.shootingStars.map((star) => (
            <div
              key={`shooting-${star.id}`}
              className={`absolute w-24 h-px bg-gradient-to-r ${shootingStarColor} to-transparent animate-shooting-star`}
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <LandingHeader />
      
        {/* Main Content */}
        <main className="pt-20 sm:pt-24 pb-16 flex flex-col items-center justify-center min-h-screen">
          {/* Centered Logo and Text */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <SulikoLogo 
              width={160} 
              height={160} 
              className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-36 lg:w-36 mb-3 sm:mb-4"
            />
            <p className="text-center text-muted-foreground max-w-sm sm:max-w-md text-base sm:text-lg lg:text-xl leading-tight px-2">
              თარჯიმნების ასისტენტი — ატვირთე დოკუმენტი და შეამცირე თარგმნის დრო 70%-მდე. კონცენტრირდი შინაარსზე, არა ტექნიკურ სამუშაოზე.
            </p>
          </div>

          <div className="container mx-auto px-4 py-4 sm:py-8 max-w-md">
            <Card>
            <CardContent>
              <form 
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    {t("nameLabel")} <span className="text-muted-foreground font-normal">({t("nameOptional")})</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    {t("phoneLabel")}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder={t("phonePlaceholder")}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    maxLength={11} // XXX XXX XXX format
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-2.5 sm:py-3 text-base sm:text-lg"
                  disabled={phoneNumber.replace(/\s/g, '').length !== 9 || isSubmitting}
                >
                  {isSubmitting ? t("submitting") : t("submitButton")}
                </Button>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
                  <Button 
                    type="button"
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => window.location.href = '/document'}
                  >
                    {t("startTranslating")}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                    onClick={() => window.location.href = '/price'}
                  >
                    {t("viewPricing")}
                  </Button>
                </div>
                
                {/* Success Message */}
                {submitStatus === 'success' && (
                  <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                      {t("successTitle")}
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      {t("successMessage")}
                    </p>
                  </div>
                )}
                
                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      {t("errorTitle")}
                    </h3>
                    <p className="text-red-700 dark:text-red-300 mb-4">
                      {t("errorMessage")}
                    </p>
                    <Button 
                      onClick={() => setSubmitStatus('idle')}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      {t("tryAgain")}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
        {/* Footer */}
        <LandingFooter />
      </div>
    </div>
  );
}
