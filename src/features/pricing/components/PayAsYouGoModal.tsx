'use client';

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/features/ui/components/ui/dialog";
import { Button } from '@/features/ui/components/ui/button';
import { Input } from '@/features/ui/components/ui/input';
import { Label } from '@/features/ui/components/ui/label';
import { Calculator, CreditCard, AlertCircle } from "lucide-react";
import { createPayment } from "../services/paymentService";

interface PayAsYouGoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRICE_PER_PAGE = 0.83; // 10 GEL / 12 pages = 0.83 GEL per page
const MINIMUM_AMOUNT = 5; // Minimum purchase amount
const MAXIMUM_AMOUNT = 1000; // Maximum purchase amount

export function PayAsYouGoModal({ isOpen, onClose }: PayAsYouGoModalProps) {
  const t = useTranslations("Pricing");
  const [amount, setAmount] = useState<string>('');
  const [pages, setPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Calculate pages when amount changes
  useEffect(() => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      const calculatedPages = Math.floor(numericAmount / PRICE_PER_PAGE);
      setPages(calculatedPages);
    } else {
      setPages(0);
    }
  }, [amount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setError('');
  };

  const validateAmount = (): boolean => {
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError(t('payAsYouGoModal.errors.invalidAmount'));
      return false;
    }
    
    if (numericAmount < MINIMUM_AMOUNT) {
      setError(t('payAsYouGoModal.errors.minimumAmount', { min: MINIMUM_AMOUNT }));
      return false;
    }
    
    if (numericAmount > MAXIMUM_AMOUNT) {
      setError(t('payAsYouGoModal.errors.maximumAmount', { max: MAXIMUM_AMOUNT }));
      return false;
    }
    
    return true;
  };

  const handlePurchase = async () => {
    if (!validateAmount()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const numericAmount = parseFloat(amount);
      const response = await createPayment(numericAmount, 'GEL', 'GE');
      window.open(response.redirectUrl, "_blank");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payAsYouGoModal.errors.purchaseFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedAmounts = [10, 25, 50, 100];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-suliko-default-color mb-4">
            {t('payAsYouGoModal.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Price Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                {t('payAsYouGoModal.amountLabel')}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="10"
                  min={MINIMUM_AMOUNT}
                  max={MAXIMUM_AMOUNT}
                  step="0.01"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  ₾
                </span>
              </div>
            </div>

            {/* Suggested Amounts */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                {t('payAsYouGoModal.suggestedAmounts')}
              </Label>
              <div className="flex gap-2 flex-wrap">
                {suggestedAmounts.map((suggestedAmount) => (
                  <Button
                    key={suggestedAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(suggestedAmount.toString())}
                    className="flex-1 min-w-0"
                  >
                    {suggestedAmount} ₾
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Calculation Display */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {t('payAsYouGoModal.pagesCalculation')}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {pages}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('payAsYouGoModal.pages')}
                </div>
              </div>
            </div>
            
            {pages > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('payAsYouGoModal.pricePerPage')}
                  </span>
                  <span className="text-foreground">
                    {PRICE_PER_PAGE.toFixed(2)} ₾
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">
                    {t('payAsYouGoModal.totalAmount')}
                  </span>
                  <span className="font-semibold text-foreground">
                    {parseFloat(amount || '0').toFixed(2)} ₾
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              {t('payAsYouGoModal.cancel')}
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!amount || pages === 0 || isLoading || !!error}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  {t('payAsYouGoModal.processing')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('payAsYouGoModal.purchase')}
                </div>
              )}
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>{t('payAsYouGoModal.pagesNeverExpire')}</p>
            <p>{t('payAsYouGoModal.minimumPurchase', { min: MINIMUM_AMOUNT })}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
