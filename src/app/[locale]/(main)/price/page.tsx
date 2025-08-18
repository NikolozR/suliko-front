'use client'
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";
import { Button } from '@/features/ui/components/ui/button';


export default function PricePackages() {
  const t = useTranslations("Pricing");
  const welcomeT = useTranslations("WelcomeModal");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(t('email'));
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 mt-10 text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground text-lg">{t("description")}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Starter Package */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border flex flex-col h-full">
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-card-foreground text-center">{t("starter.title")}</h3>
            <div className="mb-6 text-center">
              <span className="text-4xl font-bold text-card-foreground">₾{t("starter.price")}</span>
              <span className="text-muted-foreground">{t("starter.period")}</span>
            </div>
            <div className="text-left">
              <p className="text-card-foreground">{t("starter.documents")}</p>
            </div>
          </div>
          <div className="mt-auto pt-8">
            <button onClick={() => setShowPaymentModal(true)} className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition duration-200">
              {t("select")}
            </button>
          </div>
        </div>

        {/* Professional Package */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border flex flex-col h-full">
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-card-foreground text-center">{t("professional.title")}</h3>
            <div className="mb-6 text-center">
              <span className="text-4xl font-bold text-card-foreground">₾{t("professional.price")}</span>
              <span className="text-muted-foreground">{t("professional.period")}</span>
            </div>
            <div className="text-left">
              <p className="text-card-foreground">{t("professional.documents")}</p>
            </div>
          </div>
          <div className="mt-auto pt-8">
            <button onClick={() => setShowPaymentModal(true)} className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition duration-200">
              {t("select")}
            </button>
          </div>
        </div>

        {/* Custom Package */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border flex flex-col h-full">
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-card-foreground text-center">{t("custom.title")}</h3>
            <p className="text-muted-foreground text-center">{t("custom.description")}</p>
          </div>
          <div className="mt-auto pt-8">
            <button 
              onClick={() => setShowPaymentModal(true)}
              className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {t("select")}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
      <DialogContent className="max-w-md mx-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-suliko-default-color mb-4">
            {t('paymentModal.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-foreground leading-relaxed">
          <p className="text-center">{t('paymentModal.description')}</p>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
              <span className="flex-1 font-mono text-sm">{t('email')}</span>
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
          
          <p className="text-center text-sm text-muted-foreground">
            {t('paymentModal.additionalInfo')}
          </p>
        </div>
        
        
      </DialogContent>
    </Dialog>

    </div>
  );
}
