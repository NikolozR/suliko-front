"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { Input } from "@/features/ui/components/ui/input";
import { Label } from "@/features/ui/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/components/ui/form";
import { sendVerificationCode, recoverPassword } from "@/features/auth/services/authorizationService";
import ErrorAlert from "@/shared/components/ErrorAlert";

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RecoveryStep = "phone" | "verification" | "password";

interface RecoveryFormData {
  phoneNumber: string;
  verificationCode?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations("Authorization");
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sentVerificationCode, setSentVerificationCode] = useState<string>("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [verificationDigits, setVerificationDigits] = useState<string[]>(Array(6).fill(""));

  const createRecoveryFormSchema = (t: (key: string) => string, locale?: string) => z.object({
    phoneNumber: z.string()
      .min(1, t("phoneNumberRequiredError"))
      .regex(
        locale === 'pl' ? /^(\+48)?[1-9]\d{8}$/ : /^5\d{8}$/, 
        t("phoneNumberFormatError")
      ),
    verificationCode: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  }).refine((data) => {
    if (currentStep === "password") {
      return data.newPassword === data.confirmPassword;
    }
    return true;
  }, {
    message: t("passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

  const formSchema = createRecoveryFormSchema(t, locale);
  
  const form = useForm<RecoveryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      verificationCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSendVerificationCode = async () => {
    const phoneNumber = form.getValues("phoneNumber");
    const valid = await form.trigger("phoneNumber");
    if (!valid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendVerificationCode(phoneNumber);
      setSentVerificationCode(response.code.toString());
      setCurrentStep("verification");
      
      // Start resend timer
      setResendTimer(30);
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("sendCodeError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const verificationCode = verificationDigits.join("");
    if (!verificationCode || verificationCode.length !== 6) {
      setError(t("pleaseEnterVerificationCode"));
      return;
    }

    if (verificationCode !== sentVerificationCode) {
      setError(t("incorrectVerificationCode"));
      return;
    }

    setCurrentStep("password");
    setError(null);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newDigits = [...verificationDigits];
    newDigits[index] = value;
    setVerificationDigits(newDigits);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`verification-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationDigits[index] && index > 0) {
      const prevInput = document.getElementById(`verification-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleRecoverPassword = async () => {
    const phoneNumber = form.getValues("phoneNumber");
    const newPassword = form.getValues("newPassword");
    const confirmPassword = form.getValues("confirmPassword");

    if (!newPassword || !confirmPassword) {
      setError(t("passwordMinLengthError"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await recoverPassword(phoneNumber, newPassword);
      setSuccess(t("passwordRecoverySuccess"));
      // Auto close after 3 seconds
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("passwordRecoveryError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    await handleSendVerificationCode();
  };

  const handleBackToLogin = () => {
    setCurrentStep("phone");
    form.reset();
    setError(null);
    setSuccess(null);
    setSentVerificationCode("");
    setResendTimer(0);
    setIsNewPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setVerificationDigits(Array(6).fill(""));
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "phone":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("enterPhoneForRecovery")}
            </p>
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("phoneNumberForRecovery")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("phoneNumberPlaceholder")}
                      type="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              onClick={handleSendVerificationCode}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t("sending") : t("sendCode")}
            </Button>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("enterVerificationCode")}
            </p>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("verificationCode")}</Label>
              <div className="flex gap-2 justify-center">
                {verificationDigits.map((digit, index) => (
                  <Input
                    key={index}
                    id={`verification-${index}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-suliko-default-color focus:ring-0"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleVerifyCode}
                className="flex-1"
              >
                {t("verify")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={resendTimer > 0}
                className="flex-1"
              >
                {resendTimer > 0 ? `${t("resendIn")} ${resendTimer}s` : t("resendCode")}
              </Button>
            </div>
          </div>
        );

      case "password":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("step3")}
            </p>
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder={t("passwordPlaceholder")}
                        type={isNewPasswordVisible ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {isNewPasswordVisible ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmNewPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder={t("confirmPasswordPlaceholder")}
                        type={isConfirmPasswordVisible ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {isConfirmPasswordVisible ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              onClick={handleRecoverPassword}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t("sending") : t("recoverPassword")}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "phone":
        return t("step1");
      case "verification":
        return t("step2");
      case "password":
        return t("step3");
      default:
        return t("recoverPassword");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit rounded-lg pt-[40px] pb-[32px] px-[70px] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{getStepTitle()}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <ErrorAlert
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form className="space-y-4">
            {renderStepContent()}
          </form>
        </Form>

        <div className="flex justify-center mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToLogin}
            className="cursor-pointer"
          >
            {t("backToLogin")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordRecoveryModal;
