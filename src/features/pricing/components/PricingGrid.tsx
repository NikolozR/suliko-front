'use client';

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { createPayment } from "../services/paymentService";

export function PricingGrid() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSelectNotReadyPackage = () => {
    setShowPaymentModal(true);
  };

  const handleSelectPackage = async (amount: number, currency: string, country: string) => {
    const response = await createPayment(amount, currency, country);
    window.open(response.redirectUrl, "_blank");
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard type="starter" onSelect={() => handleSelectPackage(20, 'USD', 'US')} />
        <PricingCard type="professional" onSelect={() => handleSelectPackage(67, 'USD', 'US')} />
        <PricingCard type="enterprise" onSelect={handleSelectNotReadyPackage} />
      </div>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </>
  );
}
