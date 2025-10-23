"use client";
import React, { useState } from "react";
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
import { sendVerificationCode, validateRecoveryCode, recoverPassword } from "@/features/auth/services/authorizationService";
import ErrorAlert from "@/shared/components/ErrorAlert";

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecoveryStep = 'phone' | 'verification' | 'password' | 'success';

const createPhoneSchema = (t: (key: string) => string, locale?: string) => z.object({
  phoneNumber: z.string()
    .min(1, t("phoneNumberRequiredError"))
    .regex(
      locale === 'pl' ? /^(\+48)?[1-9]\d{8}$/ : /^5\d{8}$/,
      t("phoneNumberFormatError")
    ),
});

const createVerificationSchema = (t: (key: string) => string) => z.object({
  verificationCode: z.string()
    .min(1, t("pleaseEnterVerificationCode")),
});

const createPasswordSchema = (t: (key: string) => string) => z.object({
  newPassword: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, t("passwordRegexError")),
  confirmPassword: z.string()
    .min(1, t("confirmPasswordRequired")),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t("passwordsDoNotMatch"),
  path: ["confirmPassword"],
});

type PhoneFormData = z.infer<ReturnType<typeof createPhoneSchema>>;
type VerificationFormData = z.infer<ReturnType<typeof createVerificationSchema>>;
type PasswordFormData = z.infer<ReturnType<typeof createPasswordSchema>>;

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Authorization");
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone form
  const phoneSchema = createPhoneSchema(t, locale);
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
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

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await sendVerificationCode(data.phoneNumber);
      setPhoneNumber(data.phoneNumber);
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

  const handleVerificationSubmit = async (data: VerificationFormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await validateRecoveryCode(phoneNumber, data.verificationCode);
      setVerificationCode(data.verificationCode);
      setCurrentStep('password');
    } catch (err) {
      let message = err instanceof Error ? err.message : t("incorrectVerificationCode");
      
      if (message.includes('CORS') || message.includes('cross-origin') || message.includes('Network Error')) {
        message = t("corsErrorMessage");
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await recoverPassword(phoneNumber, data.newPassword, verificationCode);
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
    setPhoneNumber("");
    setVerificationCode("");
    setError(null);
    phoneForm.reset();
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
          <DialogHeader>
            <DialogTitle>{t("passwordResetSuccess")}</DialogTitle>
            <DialogDescription>
              {t("passwordResetSuccessMessage")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose}>
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'phone':
        return t("step1");
      case 'verification':
        return t("step2");
      case 'password':
        return t("step3");
      default:
        return t("passwordRecovery");
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'phone':
        return t("enterPhoneForRecovery");
      case 'verification':
        return t("verificationCodeSent");
      case 'password':
        return t("setNewPassword");
      default:
        return t("passwordRecoveryDescription");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>
        
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {currentStep === 'phone' && (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phoneNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("enterPhoneNumber")}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("sending") : t("sendCode")}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {currentStep === 'verification' && (
          <Form {...verificationForm}>
            <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-4">
              <FormField
                control={verificationForm.control}
                name="verificationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("verificationCode")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("enterVerificationCode")}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  {t("backToLogin")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("verify") : t("verify")}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {currentStep === 'password' && (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("newPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("newPassword")}
                        {...field}
                        disabled={isLoading}
                      />
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
                    <FormLabel>{t("confirmNewPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("confirmNewPassword")}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  {t("backToLogin")}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t("sending") : t("setNewPassword")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordRecoveryModal;
