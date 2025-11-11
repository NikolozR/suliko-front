"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/features/ui";
import { Button } from "@/features/ui";
import LandingHeader from "@/shared/components/LandingHeader";
import LandingFooter from "@/shared/components/LandingFooter";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // You can extract payment information from URL parameters if needed
    const orderId = searchParams.get('orderId');
    const transactionId = searchParams.get('transactionId');
    
    if (orderId || transactionId) {
      console.log('Payment success - Order ID:', orderId, 'Transaction ID:', transactionId);
      // TODO: Fetch payment details and update user balance
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900" />
      
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

                {/* Success Message */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    Payment Successful!
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    Thank you for your payment. Your transaction has been completed successfully.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button 
                    className="w-full sm:w-1/2 h-12 sm:h-14 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => router.push('/document')}
                  >
                    Start Translating
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full sm:w-1/2 h-12 sm:h-14 text-sm sm:text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium"
                    onClick={() => router.push('/profile')}
                  >
                    View Profile
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                        What&apos;s Next?
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your balance has been updated. You can now start using our translation services.
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

