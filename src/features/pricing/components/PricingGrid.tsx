'use client';

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { PayAsYouGoModal } from "./PayAsYouGoModal";
import { createPayment } from "../services/paymentService";

export function PricingGrid() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);

  const handleSelectPayAsYouGo = () => {
    setShowPayAsYouGoModal(true);
  };

  const handleSelectPackage = async (amount: number, currency: string = 'GEL', country: string = 'GE') => {
    try {
      const response = await createPayment(amount, currency, country);
      window.open(response.redirectUrl, "_blank");
    } catch (error) {
      console.error('Payment failed:', error);
      // Could show an error modal here
    }
  }

  const handleStarterPackage = () => {
    handleSelectPackage(57); // 57 GEL for Starter package
  };

  const handleProfessionalPackage = () => {
    handleSelectPackage(173); // 173 GEL for Professional package
  };

  // Removed handleTrySuliko as it's no longer used

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
