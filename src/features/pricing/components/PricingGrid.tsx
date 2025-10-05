'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { PayAsYouGoModal } from "./PayAsYouGoModal";
// import { createPayment } from "../services/paymentService";

export function PricingGrid() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const handleSelectPayAsYouGo = () => {
    // Redirect to document page like other plans
    router.push(`/${locale}/document`);
  };

  // const handleSelectPackage = async (amount: number, currency: string, country: string) => {
  //   const response = await createPayment(amount, currency, country);
  //   window.open(response.redirectUrl, "_blank");
  // }

  const handleTrySuliko = () => {
    router.push(`/${locale}/document`);
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard type="starter" onSelect={handleTrySuliko} />
        <PricingCard type="professional" onSelect={handleTrySuliko} />
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
