"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/features/ui";
import { Button } from "@/features/ui";
import LandingHeader from "@/shared/components/LandingHeader";
import LandingFooter from "@/shared/components/LandingFooter";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900" />
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <LandingHeader />
      
        {/* Main Content */}
        <main className="pt-20 sm:pt-24 pb-16 flex flex-col items-center justify-center min-h-screen">
          <div className="container mx-auto px-4 py-4 sm:py-8 max-w-md">
            <Card className="overflow-hidden">
              <CardContent className="p-6 sm:p-8 overflow-hidden">
                {/* Cancel Icon */}
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>

                {/* Cancel Message */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    Payment Cancelled
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    Your payment transaction was cancelled. No charges have been made to your account.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button 
                    className="w-full sm:w-1/2 h-12 sm:h-14 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => router.push('/price')}
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full sm:w-1/2 h-12 sm:h-14 text-sm sm:text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                    onClick={() => router.push('/')}
                  >
                    Go Home
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                        Need Help?
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        If you encountered any issues during payment, please contact our support team for assistance.
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

