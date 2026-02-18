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

interface EmailPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onContinueAnyway: () => void;
}

export const EmailPromptModal: React.FC<EmailPromptModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  onContinueAnyway,
}) => {
  const t = useTranslations("DocumentTranslationCard");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit rounded-lg py-[40px] px-[70px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t("emailDialog.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-center space-y-3">
          <p className="text-muted-foreground">
            {t("emailDialog.description")}
          </p>
        </div>
        <DialogFooter className="flex !justify-center items-center gap-2 mt-4">
          <Button onClick={onProceed}>{t("emailDialog.proceed")}</Button>
          <Button variant="outline" onClick={onContinueAnyway}>
            {t("emailDialog.continueAnyway")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
