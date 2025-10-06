'use client';

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { PayAsYouGoModal } from "./PayAsYouGoModal";
import { createPayment } from "../services/paymentService";

export function PricingGrid() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const handleSelectPayAsYouGo = () => {
    setShowPayAsYouGoModal(true);
  };

  const handleSelectPackage = async (amount: number, currency: string = 'GEL', country: string = 'GE') => {
    setIsLoading(true);
    try {
      const response = await createPayment(amount, currency, country);
      window.open(response.redirectUrl, "_blank");
    } catch (error) {
      console.error('Payment failed:', error);
      // Could show an error modal here
    } finally {
      setIsLoading(false);
    }
  }

  const handleStarterPackage = () => {
    handleSelectPackage(57); // 57 GEL for Starter package
  };

  const handleProfessionalPackage = () => {
    handleSelectPackage(173); // 173 GEL for Professional package
  };

  const handleTrySuliko = () => {
    router.push(`/${locale}/document`);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard type="starter" onSelect={handleStarterPackage} />
        <PricingCard type="professional" onSelect={handleProfessionalPackage} />
        <PricingCard type="payAsYouGo" onSelect={handleSelectPayAsYouGo} />
      </div>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
      
      <PayAsYouGoModal 
        isOpen={showPayAsYouGoModal} 
        onClose={() => setShowPayAsYouGoModal(false)} 
      />
    </>
  );
}
