import React, { useEffect, useRef, useState } from 'react';
import { Input } from "@/features/ui/components/ui/input";

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  disabled?: boolean;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChange,
  isValid,
  disabled = false
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
    if (e.key === 'Backspace' && !individualDigits[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^\d]/g, '').slice(0, 6);
    const newDigits = [...pastedData.split(''), ...Array(6 - pastedData.length).fill('')];
    setIndividualDigits(newDigits);
    onChange(pastedData);
  };

  return (
    <div className="flex gap-2 justify-between">
      {individualDigits.map((digit, index) => (
        <Input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`w-12 h-12 text-center text-lg font-semibold border-2 
            ${isValid && digit ? 'border-green-500 dark:border-green-400' : 
              !isValid && digit ? 'border-red-500 dark:border-red-400' : 
              'border-gray-300 dark:border-slate-600'}
            ${disabled ? 'bg-gray-100 dark:bg-gray-800' : ''}
          `}
        />
      ))}
    </div>
  );
};

export default VerificationCodeInput; 