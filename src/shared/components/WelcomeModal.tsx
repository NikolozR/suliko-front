"use client";
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/features/ui/components/ui/dialog';
import { Button } from '@/features/ui/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations('WelcomeModal');
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-suliko-default-color mb-4">
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-foreground leading-relaxed">
          <p>{t('thankYou')}</p>
          
          <p className="font-semibold text-green-600 dark:text-green-400">{t('freePages')}</p>
          
          <p>{t('betaNotice')}</p>
          
          <p>{t('workingOnIssues')}</p>
          
          <div>
            <p className="mb-2">{t('reportIssues')}</p>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
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
                    <span className="text-green-600">{t('emailCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t('copyEmail')}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-center font-medium">{t('thankYouEnd')}</p>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button
            type="button"
            onClick={onClose}
            className="px-8"
          >
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal; 