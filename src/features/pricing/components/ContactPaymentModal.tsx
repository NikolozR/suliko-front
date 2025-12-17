'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { Button } from '@/features/ui/components/ui/button';
import { CheckCircle, Copy, Mail } from "lucide-react";

interface ContactPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactPaymentModal({ isOpen, onClose }: ContactPaymentModalProps) {
  const welcomeT = useTranslations("WelcomeModal");
  const [emailCopied, setEmailCopied] = useState(false);
  const contactEmail = "misha@suliko.ge";

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-suliko-default-color mb-4">
            Contact Us for Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-foreground leading-relaxed">
          <p className="text-center">
            Please contact us to complete your payment.
          </p>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 font-mono text-sm">{contactEmail}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyEmail}
                className="flex items-center gap-1"
                disabled={emailCopied}
              >
                {emailCopied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">{welcomeT('emailCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {welcomeT('copyEmail')}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="mt-2"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

