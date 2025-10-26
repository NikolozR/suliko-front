"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/features/ui";
import { Button } from "@/features/ui";
import { useState, useEffect, useMemo } from "react";
import LandingHeader from "@/shared/components/LandingHeader";
import LandingFooter from "@/shared/components/LandingFooter";
import { useTheme } from "next-themes";

export default function ThankYouPage() {
  const t = useTranslations("ThankYouPage");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-aware star colors
  const isDark = mounted && resolvedTheme === "dark";
  const starColor = isDark ? "white" : "#1e40af"; // Blue for light theme, white for dark
  const shootingStarColor = isDark ? "from-white via-blue-200" : "from-blue-600 via-blue-400";

  // Generate stable star positions using useMemo to avoid hydration mismatches
  const starData = useMemo(() => {
    if (!mounted || typeof window === 'undefined') {
      return { stars: [], mediumStars: [], smallStars: [], shootingStars: [] };
    }
    
    try {
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
    } catch (error) {
      console.warn('Error generating stars:', error);
      return { stars: [], mediumStars: [], smallStars: [], shootingStars: [] };
    }
  }, [mounted]);

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
          <div className="container mx-auto px-4 py-4 sm:py-8 max-w-md">
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8 overflow-hidden">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Thank You Message */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    {t("title")}
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    {t("message")}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button 
                    className="w-full sm:w-1/2 h-12 sm:h-14 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => window.location.href = '/document'}
                  >
                    {t("startTranslating")}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full sm:w-1/2 h-12 sm:h-14 text-sm sm:text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                    onClick={() => window.location.href = '/price'}
                  >
                    {t("viewPricing")}
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                        {t("infoTitle")}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t("infoMessage")}
                      </p>
                    </div>
                  </div>
                </div>
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
