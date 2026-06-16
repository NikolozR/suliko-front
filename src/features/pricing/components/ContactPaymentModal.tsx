'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { Button } from '@/features/ui/components/ui/button';
import { Phone, MessageCircle, Copy, Check } from "lucide-react";
import { NOTARY_PHONE, NOTARY_WHATSAPP } from "@/shared/constants/notary";

interface ContactPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactPaymentModal({ isOpen, onClose }: ContactPaymentModalProps) {
  const t = useTranslations("Pricing");
  const [isCopied, setIsCopied] = useState(false);
  const contactPhone = NOTARY_PHONE;
  const contactPhoneHref = NOTARY_PHONE;
  const whatsappHref = `https://wa.me/${NOTARY_WHATSAPP}`;
  const contactEmail = "info@suliko.io";
  const bankAccount = "GE42BG0000000607709128";

  const handleCopyBankAccount = async () => {
    try {
      await navigator.clipboard.writeText(bankAccount);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy bank account:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden border-primary/20">
        <div className="bg-linear-to-b from-primary/10 via-background to-background p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-suliko-default-color mb-4">
            {t("payAsYouGoModal.contactPayment.title")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 text-foreground leading-relaxed">
          <p className="text-center text-sm text-muted-foreground">
            {t("payAsYouGoModal.contactPayment.subtitle")}
          </p>

          <div className="rounded-xl border bg-slate-50/90 dark:bg-slate-900/60 p-4 space-y-3 shadow-sm">
            <p className="text-sm">
              {t("payAsYouGoModal.contactPayment.manualTransferNotice")}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("payAsYouGoModal.contactPayment.bankAccountLabel")}
            </p>
            <div className="flex items-center gap-2 bg-background border rounded px-3 py-2">
              <p className="font-mono text-sm break-all flex-1">
                {bankAccount}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyBankAccount}
                className="shrink-0 h-8 px-2"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                    {t("payAsYouGoModal.contactPayment.copiedButton")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {t("payAsYouGoModal.contactPayment.copyButton")}
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm">
              {t("payAsYouGoModal.contactPayment.receiptNotice")}{" "}
              <a href={`mailto:${contactEmail}`} className="font-semibold underline underline-offset-2">
                {contactEmail}
              </a>{" "}
              {t("payAsYouGoModal.contactPayment.receiptNoticeSuffix")}
              .
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-11">
              <a href={`tel:${contactPhoneHref}`} className="inline-flex items-center justify-center gap-2 font-medium">
                <Phone className="h-4 w-4" />
                {t("payAsYouGoModal.contactPayment.callButton")} {contactPhone}
              </a>
            </Button>
            <Button asChild className="h-11 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 font-medium">
                <MessageCircle className="h-4 w-4" />
                {t("payAsYouGoModal.contactPayment.whatsappButton")}
              </a>
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="mt-1 min-w-28"
              variant="secondary"
            >
              {t("payAsYouGoModal.contactPayment.close")}
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

