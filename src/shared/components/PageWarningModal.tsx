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
import { AlertTriangle } from "lucide-react";

interface PageWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageCount: number;
}

export const PageWarningModal: React.FC<PageWarningModalProps> = ({ isOpen, onClose, pageCount }) => {
  const t = useTranslations("DocumentTranslationCard");
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit rounded-lg py-[40px] px-[70px]">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            {t("warningDialog.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-center space-y-3">
          <p className="text-muted-foreground">
            {t("warningDialog.pageCountInfo")}
            <span className="font-bold underline mx-1">
              {pageCount} {t(pageCount === 1 ? "pageCount.page" : "pageCount.pages")}
            </span>
          </p>
          <p className="text-muted-foreground">
            {t("warningDialog.description")}
          </p>
        </div>
        <DialogFooter className="flex !justify-center items-center gap-2 mt-4">
          <Button 
            onClick={onClose} 
            className="cursor-pointer"
          >
            {t("warningDialog.understand")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
