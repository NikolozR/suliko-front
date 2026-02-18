'use client';
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { useTranslations } from "next-intl";

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onOkay: () => void;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  onOkay,
}) => {
  const t = useTranslations("Pricing");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit rounded-lg py-[40px] px-[70px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t("offerModal.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-center space-y-3">
          <p className="text-muted-foreground">
            {t("offerModal.description")}
          </p>
        </div>
        <DialogFooter className="flex !justify-center items-center gap-2 mt-4">
          <Button onClick={onProceed}>{t("offerModal.proceed")}</Button>
          <Button variant="outline" onClick={onOkay}>
            {t("offerModal.okay")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
