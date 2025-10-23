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
import { recoverPassword, validateRecoveryCode, resetPassword } from "@/features/auth/services/authorizationService";
import ErrorAlert from "@/shared/components/ErrorAlert";

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createStep1Schema = (t: (key: string) => string, locale?: string) => z.object({
  phoneNumber: z.string()
    .min(1, t("phoneNumberRequiredError"))
    .regex(
      locale === 'pl' ? /^(\+48)?[1-9]\d{8}$/ : /^5\d{8}$/, 
      t("phoneNumberFormatError")
    ),
});

const createStep2Schema = (t: (key: string) => string) => z.object({
  code: z.string()
    .min(1, t("pleaseEnterVerificationCode")),
  newPassword: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, t("passwordRegexError")),
  confirmPassword: z.string()
    .min(1, t("confirmPasswordRequired")),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t("passwordsDoNotMatch"),
  path: ["confirmPassword"],
});

type Step1FormData = z.infer<ReturnType<typeof createStep1Schema>>;
type Step2FormData = z.infer<ReturnType<typeof createStep2Schema>>;

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Authorization");
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resetToken, setResetToken] = useState("");

  const step1Schema = createStep1Schema(t, locale);
  const step2Schema = createStep2Schema(t);

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: { phoneNumber: "" },
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const handleStep1Submit = async (data: Step1FormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await recoverPassword(data.phoneNumber);
      setPhoneNumber(data.phoneNumber);
      setCurrentStep(2);
    } catch (err) {
      let message = err instanceof Error ? err.message : "Password recovery failed";
      
      // Check for CORS errors and provide user-friendly messages
      if (message.includes('CORS') || message.includes('cross-origin') || message.includes('Network Error')) {
        message = t("corsErrorMessage");
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (data: Step2FormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // First validate the code
      const validationResponse = await validateRecoveryCode(phoneNumber, data.code) as any;
      
      if (validationResponse?.token) {
        setResetToken(validationResponse.token);
        
        // Then reset the password
        await resetPassword(phoneNumber, data.newPassword, validationResponse.token);
        setSuccess(true);
      } else {
        throw new Error("Invalid validation response");
      }
    } catch (err) {
      let message = err instanceof Error ? err.message : "Password reset failed";
      
      // Check for CORS errors and provide user-friendly messages
      if (message.includes('CORS') || message.includes('cross-origin') || message.includes('Network Error')) {
        message = t("corsErrorMessage");
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    step1Form.reset();
    step2Form.reset();
    setError(null);
    setSuccess(false);
    setCurrentStep(1);
    setPhoneNumber("");
    setResetToken("");
    onClose();
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
    setError(null);
    step2Form.reset();
  };

  if (success) {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1 ? t("step1") : t("step2")}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? t("passwordRecoveryDescription")
              : t("verificationCodeSent")
            }
          </DialogDescription>
        </DialogHeader>
        
        {currentStep === 1 ? (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <FormField
                control={step1Form.control}
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

              {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

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
                  {isLoading ? t("sending") : t("sendRecoveryLink")}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
              <FormField
                control={step2Form.control}
                name="code"
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

              <FormField
                control={step2Form.control}
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
                control={step2Form.control}
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

              {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBackToStep1}
                  disabled={isLoading}
                >
                  {t("cancel")}
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
