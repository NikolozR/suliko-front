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
import { recoverPassword } from "@/features/auth/services/authorizationService";
import ErrorAlert from "@/shared/components/ErrorAlert";

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createPasswordRecoverySchema = (t: (key: string) => string, locale?: string) => z.object({
  phoneNumber: z.string()
    .min(1, t("phoneNumberRequiredError"))
    .regex(
      locale === 'pl' ? /^(\+48)?[1-9]\d{8}$/ : /^5\d{8}$/,
      t("phoneNumberFormatError")
    ),
  newPassword: z.string()
    .min(8, t("passwordMinLengthError"))
    .regex(/(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, t("passwordRegexError")),
  confirmPassword: z.string()
    .min(1, t("confirmPasswordRequired")),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t("passwordsDoNotMatch"),
  path: ["confirmPassword"],
});

type PasswordRecoveryFormData = z.infer<ReturnType<typeof createPasswordRecoverySchema>>;

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("Authorization");
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordRecoverySchema = createPasswordRecoverySchema(t, locale);

  const form = useForm<PasswordRecoveryFormData>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { phoneNumber: "", newPassword: "", confirmPassword: "" },
  });

  const handleSubmit = async (data: PasswordRecoveryFormData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await recoverPassword(data.phoneNumber, data.newPassword);
      setSuccess(true);
    } catch (err) {
      let message = err instanceof Error ? err.message : "Password recovery failed";
      
      // Check for specific error types and provide user-friendly messages
      if (message.includes('CORS') || message.includes('cross-origin') || message.includes('Network Error')) {
        message = t("corsErrorMessage");
      } else if (message.includes('405') || message.includes('Method Not Allowed')) {
        message = "Server configuration error. Please try again or contact support.";
      } else if (message.includes('404') || message.includes('Not Found')) {
        message = "Password recovery endpoint not found. Please contact support or try again later.";
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setError(null);
    setSuccess(false);
    onClose();
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
            {t("passwordRecovery")}
          </DialogTitle>
          <DialogDescription>
            {t("passwordRecoveryDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
            <FormField
              control={form.control}
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
              control={form.control}
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
                {isLoading ? t("sending") : t("resetPassword")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordRecoveryModal;
