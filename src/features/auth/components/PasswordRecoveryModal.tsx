"use client";
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/components/ui/form";
import { sendVerificationCode, recoverPassword, checkUserExists } from "@/features/auth/services/authorizationService";
import ErrorAlert from "@/shared/components/ErrorAlert";
import { Eye, EyeOff, CheckCircle, Shield, Key } from "lucide-react";

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecoveryStep = 'phone' | 'verification' | 'password' | 'success';

const createIdentifierSchema = (t: (key: string) => string, locale?: string) => z.object({
  identifier: z.string()
    .min(1, t("phoneNumberOrEmailRequired"))
    .refine(
      (val) => {
        const trimmed = val.trim();
        const isEmailValue = z.string().email().safeParse(trimmed).success;
        const isPhoneValue = locale === 'pl'
          ? /^(\+48)?[1-9]\d{8}$/.test(trimmed.replace(/\s+/g, ''))
          : /^5\d{8}$/.test(trimmed.replace(/\s+/g, ''));
        return isEmailValue || isPhoneValue;
      },
      { message: t("phoneNumberOrEmailFormatError") }
    ),
});

const createVerificationSchema = (t: (key: string) => string) => z.object({
  verificationCode: z.string()
    .min(1, t("pleaseEnterVerificationCode")),
});

const createPasswordSchema = (t: (key: string) => string) => z.object({
  newPassword: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number")
    .regex(/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, "Password must contain at least one special character"),
  confirmPassword: z.string()
    .min(1, t("confirmPasswordRequired")),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t("passwordsDoNotMatch"),
  path: ["confirmPassword"],
});

// Verification Code Input Component
const VerificationCodeInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (digit.length > 1) return; // Only allow single digit
    
    const newValue = value.split('');
    newValue[index] = digit;
    const newCode = newValue.join('');
    onChange(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pastedData);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-800 transition-all duration-200"
        />
      ))}
    </div>
  );
};

type IdentifierFormData = z.infer<ReturnType<typeof createIdentifierSchema>>;
type VerificationFormData = z.infer<ReturnType<typeof createVerificationSchema>>;
type PasswordFormData = z.infer<ReturnType<typeof createPasswordSchema>>;

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Authorization");
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('phone');
  const [identifier, setIdentifier] = useState<string>("");
  const [sentVerificationCode, setSentVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Identifier form (phone or email)
  const identifierSchema = createIdentifierSchema(t, locale);
  const identifierForm = useForm<IdentifierFormData>({
    resolver: zodResolver(identifierSchema),
    defaultValues: { identifier: "" },
  });

  // Verification form
  const verificationSchema = createVerificationSchema(t);
  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { verificationCode: "" },
  });

  // Password form
  const passwordSchema = createPasswordSchema(t);
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const isEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCodeFor = async (value: string) => {
    const trimmed = value.trim();
    const response = await sendVerificationCode(
      isEmail(trimmed) ? undefined : trimmed,
      isEmail(trimmed) ? trimmed : undefined
    ) as { code: string | number };
    setSentVerificationCode(response.code?.toString() || "");
    startResendTimer();
  };

  const handleIdentifierSubmit = async (data: IdentifierFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const trimmedIdentifier = data.identifier.trim();

      const exists = await checkUserExists(trimmedIdentifier);
      if (!exists) {
        setError(t("accountNotFound"));
        return;
      }

      await sendCodeFor(trimmedIdentifier);
      setIdentifier(trimmedIdentifier);
      setCurrentStep('verification');
    } catch (err) {
      let message = err instanceof Error ? err.message : t("sendCodeError");

      if (message.includes('CORS') || message.includes('cross-origin') || message.includes('Network Error')) {
        message = t("corsErrorMessage");
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      await sendCodeFor(identifier);
    } catch (err) {
      let message = err instanceof Error ? err.message : t("sendCodeError");

      if (message.includes('CORS') || message.includes('cross-origin') || message.includes('Network Error')) {
        message = t("corsErrorMessage");
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL (backend follow-up required, not fixed here):
  // The verification code is returned to the client by sendVerificationCode (response.code) and
  // compared client-side below. This means the OTP can be read directly from the network
  // response, bypassing SMS/email possession entirely. A proper fix requires a backend endpoint
  // that verifies { identifier, code } server-side without returning the code to clients, and
  // returns a short-lived token (see ValidateRecoveryCodeResponse in types.Auth.ts) for the final
  // recoverPassword/resetPassword call. Do not remove this client-side check without a backend
  // replacement - doing so would break the currently-working (if insecure) flow entirely.
  const handleVerificationSubmit = async (data: VerificationFormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Client-side validation: compare user input with sent verification code
      if (data.verificationCode === sentVerificationCode) {
        setCurrentStep('password');
      } else {
        setError(t("incorrectVerificationCode"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("incorrectVerificationCode");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await recoverPassword(identifier, data.newPassword);
      setCurrentStep('success');
    } catch (err) {
      let message = err instanceof Error ? err.message : t("passwordRecoveryError");
      
      if (message.includes('CORS') || message.includes('cross-origin') || message.includes('Network Error')) {
        message = t("corsErrorMessage");
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('phone');
    setIdentifier("");
    setSentVerificationCode("");
    setResendTimer(0);
    setError(null);
    identifierForm.reset();
    verificationForm.reset();
    passwordForm.reset();
    onClose();
  };

  const goBack = () => {
    if (currentStep === 'verification') {
      setCurrentStep('phone');
    } else if (currentStep === 'password') {
      setCurrentStep('verification');
    }
  };

  if (currentStep === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
              {t("passwordResetSuccess")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mb-6">
              {t("passwordResetSuccessMessage")}
            </DialogDescription>
            <Button 
              onClick={handleClose}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-full max-w-sm mx-auto">
        <DialogHeader>
        </DialogHeader>
        
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {currentStep === 'phone' && (
          <Form {...identifierForm}>
            <form onSubmit={identifierForm.handleSubmit(handleIdentifierSubmit)} className="space-y-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("step1")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t("enterPhoneForRecovery")}
                </p>
              </div>

              <FormField
                control={identifierForm.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("phoneNumberOrEmail")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("phoneNumberOrEmailPlaceholder")}
                        className="border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <div className="flex justify-end gap-2">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={handleClose}
                   disabled={isLoading}
                   className="px-3 py-2 text-sm"
                 >
                   {t("cancel")}
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={isLoading}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm"
                 >
                   {isLoading ? t("sending") : t("sendCode")}
                 </Button>
               </div>
            </form>
          </Form>
        )}

        {currentStep === 'verification' && (
          <Form {...verificationForm}>
            <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-6">
               <div className="text-center mb-6">
                 <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                   <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                 </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("step2")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t("verificationCodeSent")}
                </p>
              </div>
              
              <FormField
                control={verificationForm.control}
                name="verificationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center block">
                      {t("verificationCode")}
                    </FormLabel>
                    <FormControl>
                      <VerificationCodeInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center w-full -mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("codeNotReceived")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm p-0 h-auto"
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || isLoading}
                >
                  {resendTimer > 0 ? `${t("resendIn")} ${resendTimer}s` : t("resendCode")}
                </Button>
              </div>

               <div className="flex justify-between gap-2">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={goBack}
                   disabled={isLoading}
                   className="px-3 py-2 text-sm flex-1 min-w-0"
                 >
                   {t("backToLogin")}
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={isLoading || verificationForm.watch("verificationCode").length !== 6}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm flex-1 min-w-0 disabled:opacity-50"
                 >
                   {isLoading ? t("verify") : t("verify")}
                 </Button>
               </div>
            </form>
          </Form>
        )}

        {currentStep === 'password' && (
          <div className="w-full max-w-full overflow-hidden">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6 px-2 max-w-full overflow-hidden">
               <div className="text-center mb-6">
                 <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                   <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                 </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("step3")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t("setNewPassword")}
                </p>
              </div>
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                   <FormItem>
                     <FormControl>
                      <div className="relative w-full">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                           placeholder={t("enterNewPassword")}
                          className="w-full max-w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 pr-10 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          disabled={isLoading}
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                   <FormItem>
                     <FormControl>
                      <div className="relative w-full">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                           placeholder={t("repeatNewPassword")}
                          className="w-full max-w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 pr-10 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                          {...field}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
               <div className="flex justify-between gap-2">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={goBack}
                   disabled={isLoading}
                   className="px-3 py-2 text-sm flex-1 min-w-0"
                 >
                   {t("backToLogin")}
                 </Button>
                 <Button 
                   type="submit" 
                   disabled={isLoading}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm flex-1 min-w-0"
                 >
                   {isLoading ? t("sending") : t("setNewPassword")}
                 </Button>
               </div>
            </form>
          </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordRecoveryModal;
