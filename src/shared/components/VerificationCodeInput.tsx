import React, { useEffect, useRef, useState } from 'react';
import { Input } from "@/features/ui/components/ui/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const verificationInputVariants = cva(
  "w-12 h-12 text-center text-lg font-semibold border-2",
  {
    variants: {
      isInvalid: {
        true: "border-red-500 dark:border-red-400",
      },
      isValid: {
        true: "border-green-500 dark:border-green-400",
      },
      disabled: {
        true: "bg-gray-100 dark:bg-gray-800",
      },
    },
    defaultVariants: {
      isInvalid: false,
      isValid: false,
      disabled: false,
    },
  }
);

interface VerificationCodeInputProps
  extends VariantProps<typeof verificationInputVariants> {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  isValid,
  isInvalid,
  disabled = false,
}) => {
  const [individualDigits, setIndividualDigits] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  useEffect(() => {
    // Update individual digits when value changes externally
    const digits = value.split('').slice(0, 6);
    setIndividualDigits([...digits, ...Array(6 - digits.length).fill('')]);
  }, [value]);

  const handleDigitChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return; // Only allow digits

    const newDigits = [...individualDigits];
    newDigits[index] = digit.slice(-1); // Take only the last digit if multiple are pasted
    setIndividualDigits(newDigits);

    // Combine digits and call parent onChange
    const newValue = newDigits.join('');
    onChange(newValue);

    // Move to next input if digit was entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...individualDigits];
      if (newDigits[index]) {
        newDigits[index] = '';
        setIndividualDigits(newDigits);
        onChange(newDigits.join(''));
      } else if (index > 0) {
        newDigits[index - 1] = '';
        setIndividualDigits(newDigits);
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^\d]/g, '');
    if (!pastedData) return;

    const newDigits = [...individualDigits];
    for (let i = 0; i < pastedData.length && index + i < 6; i++) {
      newDigits[index + i] = pastedData[i];
    }
    setIndividualDigits(newDigits);
    onChange(newDigits.join(''));

    const nextFocusIndex = Math.min(index + pastedData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {individualDigits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            if (el) inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          className={cn(
            verificationInputVariants({
              isValid: isValid && !!digit,
              isInvalid: isInvalid && !!digit,
              disabled,
            })
          )}
        />
      ))}
    </div>
  );
};

export default VerificationCodeInput; 