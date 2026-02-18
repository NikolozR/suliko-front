'use client';

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { PayAsYouGoModal } from "./PayAsYouGoModal";
import { ContactPaymentModal } from "./ContactPaymentModal";
import { createPayment } from "../services/paymentService";
import { isSulikoIo } from "@/shared/utils/domainUtils";
import { useAuthStore } from "@/features/auth";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export function PricingGrid() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const [showContactPaymentModal, setShowContactPaymentModal] = useState(false);
  const { token } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("Pricing");


  
  const handleSelectPackage = async (amount: number) => {
    if(!token){
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }

    // For suliko.io, show contact modal instead of making payment API call
    if (isSulikoIo()) {
      setShowContactPaymentModal(true);
      return;
    }
    try {
      // Currency and country will be determined automatically based on domain
      const response = await createPayment(amount);
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
  const handleSelectPayAsYouGo = () => {
    handleSelectPackage(1); // 173 GEL for Professional package
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

      <ContactPaymentModal 
        isOpen={showContactPaymentModal} 
        onClose={() => setShowContactPaymentModal(false)} 
      />
    </>
  );
}
