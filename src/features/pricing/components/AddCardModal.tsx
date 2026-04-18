"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { Label } from "@/features/ui/components/ui/label";
import { CreditCard, Lock } from "lucide-react";

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (card: { last4: string; brand: string; expMonth: number; expYear: number }) => void;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  return "Card";
}

export function AddCardModal({ open, onOpenChange, onSave }: AddCardModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<{ cardNumber?: string; expiry?: string; cvv?: string }>({});

  const digits = cardNumber.replace(/\s/g, "");

  function validate(): boolean {
    const next: typeof errors = {};
    if (digits.length < 13) next.cardNumber = "Enter a valid card number";
    const [mm, yy] = expiry.split("/");
    const month = parseInt(mm, 10);
    const year = parseInt("20" + yy, 10);
    if (!mm || !yy || month < 1 || month > 12 || year < new Date().getFullYear()) {
      next.expiry = "Enter a valid expiry date";
    }
    if (cvv.length < 3) next.cvv = "Enter a valid CVV";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const [mm, yy] = expiry.split("/");
    onSave({
      last4: digits.slice(-4),
      brand: detectBrand(digits),
      expMonth: parseInt(mm, 10),
      expYear: parseInt("20" + yy, 10),
    });
    handleClose();
  }

  function handleClose() {
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cardNumber">Card number</Label>
            <Input
              id="cardNumber"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              aria-invalid={!!errors.cardNumber}
              maxLength={19}
            />
            {errors.cardNumber && (
              <p className="text-xs text-destructive">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Expiry date</Label>
              <Input
                id="expiry"
                inputMode="numeric"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                aria-invalid={!!errors.expiry}
                maxLength={5}
              />
              {errors.expiry && (
                <p className="text-xs text-destructive">{errors.expiry}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                inputMode="numeric"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                aria-invalid={!!errors.cvv}
                maxLength={4}
                type="password"
              />
              {errors.cvv && (
                <p className="text-xs text-destructive">{errors.cvv}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            Your card details are encrypted and stored securely
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
