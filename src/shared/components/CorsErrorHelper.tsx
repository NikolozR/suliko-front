"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/features/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";

interface CorsErrorHelperProps {
  isOpen: boolean;
  onClose: () => void;
}

const CorsErrorHelper: React.FC<CorsErrorHelperProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Authorization");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{t("corsError")}</DialogTitle>
        <DialogDescription>
          {t("corsErrorMessage")}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <h4 className="font-medium mb-2">Possible solutions:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Clear your browser cache and cookies</li>
            <li>Try using a different browser</li>
            <li>Disable browser extensions temporarily</li>
            <li>Check if your firewall or antivirus is blocking the connection</li>
          </ul>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
};

export default CorsErrorHelper;
