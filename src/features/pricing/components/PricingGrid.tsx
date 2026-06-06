'use client';

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { PayAsYouGoModal } from "./PayAsYouGoModal";
import { ContactPaymentModal } from "./ContactPaymentModal";
import { createFlittPayment, /* createFlittSubscription, */ createPayment } from "../services/paymentService";
import { isSulikoIo } from "@/shared/utils/domainUtils";
import { useAuthStore } from "@/features/auth";
import { useRouter } from "@/i18n/navigation";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { Label } from "@/features/ui/components/ui/label";


// interface PricingGridProps {
//   autoOpenContactModal?: boolean;
// }

export function PricingGrid() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
  const [showContactPaymentModal, setShowContactPaymentModal] = useState(false);
  const [showAmountDialog, setShowAmountDialog] = useState(false);
  const [payAsYouGoAmount, setPayAsYouGoAmount] = useState(1);
  const { token } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("Pricing");

  // useEffect(() => {
  //   if (autoOpenContactModal) {
  //     setShowContactPaymentModal(true);
  //   }
  // }, [autoOpenContactModal]);



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
  // const isTestMode = () => typeof window !== "undefined" && localStorage.getItem("paymentMode") === "test";

  const handleStarterPackage = async () => {
    if (!token) {
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }
    if (isSulikoIo()) { setShowContactPaymentModal(true); return; }
    try {
      const response = await createFlittPayment(20);
      window.open(response.checkoutUrl, "_blank");
    } catch (error) {
      console.error("Payment failed:", error);
    }
    // ── SUBSCRIPTION FLOW (restore once Flitt approves) ──
    // try {
    //   const response = await createFlittSubscription("starter", 20);
    //   window.open(response.checkoutUrl, "_blank");
    // } catch (error) {
    //   console.error("Subscription failed:", error);
    // }
  };

  const handleProfessionalPackage = async () => {
    if (!token) {
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }
    if (isSulikoIo()) { setShowContactPaymentModal(true); return; }
    try {
      const response = await createFlittPayment(50);
      window.open(response.checkoutUrl, "_blank");
    } catch (error) {
      console.error("Payment failed:", error);
    }
    // ── SUBSCRIPTION FLOW (restore once Flitt approves) ──
    // try {
    //   const response = await createFlittSubscription("professional", 50);
    //   window.open(response.checkoutUrl, "_blank");
    // } catch (error) {
    //   console.error("Subscription failed:", error);
    // }
  };
  const handleSelectPayAsYouGo = () => {
    if (!token) {
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }
    setPayAsYouGoAmount(1);
    setShowAmountDialog(true);
  };

  const handleConfirmPayAsYouGo = () => {
    setShowAmountDialog(false);
    handleSelectPackage(payAsYouGoAmount);
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

      <Dialog open={showAmountDialog} onOpenChange={setShowAmountDialog}>
        <DialogContent className="max-w-sm mx-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-suliko-default-color">
              {t("payAsYouGoModal.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="payasyougo-amount" className="text-sm font-medium">
                {t("payAsYouGoModal.amountLabel")}
              </Label>
              <Input
                id="payasyougo-amount"
                type="number"
                min={1}
                step={1}
                value={payAsYouGoAmount}
                onChange={(e) => {
                  const val = Math.max(1, Math.floor(Number(e.target.value)));
                  setPayAsYouGoAmount(isNaN(val) ? 1 : val);
                }}
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAmountDialog(false)}>
                {t("payAsYouGoModal.cancel")}
              </Button>
              <Button className="flex-1" onClick={handleConfirmPayAsYouGo}>
                {t("payAsYouGoModal.purchase")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
