'use client';

import { useEffect, useState } from "react";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { PayAsYouGoModal } from "./PayAsYouGoModal";
import { ContactPaymentModal } from "./ContactPaymentModal";
import { createFlittPayment, createPayment } from "../services/paymentService";
import { isSulikoIo } from "@/shared/utils/domainUtils";
import { useAuthStore } from "@/features/auth";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";


interface PricingGridProps {
  autoOpenContactModal?: boolean;
}

export function PricingGrid({ autoOpenContactModal = false }: PricingGridProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const [showContactPaymentModal, setShowContactPaymentModal] = useState(false);
  const { token } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("Pricing");

  useEffect(() => {
    if (autoOpenContactModal) {
      setShowContactPaymentModal(true);
    }
  }, [autoOpenContactModal]);



  const handleSelectPackage = async (amount: number) => {
    if (!token) {
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }

    const choice = localStorage.getItem("paymentChoice") || "flitt";

    // For suliko.io, show contact modal instead of making payment API call
    if (isSulikoIo()) {
      setShowContactPaymentModal(true);
      return;
    }
    if (choice == "paysera") {
      try {
        // Currency and country will be determined automatically based on domain
        const response = await createPayment(amount);
        window.open(response.redirectUrl, "_blank");
      } catch (error) {
        console.error('Payment failed:', error);
        // Could show an error modal here
      }
    } else {
      try {
        // Currency and country will be determined automatically based on domain
        const response = await createFlittPayment(amount);
        console.log(response)
        window.open(response.checkoutUrl, "_blank");
      } catch (error) {
        console.error('Payment failed:', error);
        // Could show an error modal here
      }
    }
  }
  const [showPaymentContactOverlay, setShowPaymentContactOverlay] = useState(false);

  const handleStarterPackage = async () => {
    if (!token) {
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }
    if (isSulikoIo()) { setShowContactPaymentModal(true); return; }
    setShowPaymentContactOverlay(true);
  };

  const handleProfessionalPackage = async () => {
    if (!token) {
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }
    if (isSulikoIo()) { setShowContactPaymentModal(true); return; }
    setShowPaymentContactOverlay(true);
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

      {showPaymentContactOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowPaymentContactOverlay(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-card-foreground mb-2">
              გადახდა მუშაობს ტექნიკურად
            </p>
            <p className="text-muted-foreground mb-6">
              გადახდისთვის დაგვიკავშირდით:
            </p>
            <a
              href="tel:568420553"
              className="text-3xl font-bold text-primary block mb-6"
            >
              568 42 05 53
            </a>
            <button
              onClick={() => setShowPaymentContactOverlay(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              დახურვა
            </button>
          </div>
        </div>
      )}
    </>
  );
}
