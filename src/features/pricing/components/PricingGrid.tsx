'use client';

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PaymentModal } from "./PaymentModal";
import { PayAsYouGoModal } from "./PayAsYouGoModal";
import { createBogPayment } from "../services/paymentService";
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
  const [showAmountDialog, setShowAmountDialog] = useState(false);
  const [payAsYouGoAmount, setPayAsYouGoAmount] = useState(1);
  const { token } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("Pricing");


  /**
   * Sends the customer to Bank of Georgia's hosted page for the given amount.
   * Both domains bill through the same merchant, so there is no per-domain branch.
   */
  const startCheckout = async (amount: number) => {
    if (!token) {
      toast.error(t("signInToPay"));
      router.push("/sign-in");
      return;
    }

    try {
      const response = await createBogPayment(amount);
      // Same tab: opening a window after an await gets caught by popup blockers.
      window.location.href = response.redirectUrl;
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error(t("payAsYouGoModal.errors.purchaseFailed"));
    }
  };

  const handleSelectPackage = (amount: number) => startCheckout(amount);
  const handleStarterPackage = () => startCheckout(20);
  const handleProfessionalPackage = () => startCheckout(50);
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
