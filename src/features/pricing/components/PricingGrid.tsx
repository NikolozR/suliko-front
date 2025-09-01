'use client';

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";

export function PricingGrid() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSelectPackage = () => {
    setShowPaymentModal(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard type="starter" onSelect={handleSelectPackage} />
        <PricingCard type="professional" onSelect={handleSelectPackage} />
        <PricingCard type="custom" onSelect={handleSelectPackage} />
      </div>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </>
  );
}
