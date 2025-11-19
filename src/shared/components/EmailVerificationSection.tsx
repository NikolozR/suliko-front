import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/components/ui/form";
import { Input } from "@/features/ui/components/ui/input";
import { Button } from "@/features/ui/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import VerificationCodeInput from "./VerificationCodeInput";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { LoginFormData, RegisterFormData } from "@/features/auth/types/types.Auth";

interface EmailVerificationSectionProps {
  form: UseFormReturn<LoginFormData | RegisterFormData>;
  isLoginMode?: boolean;
  isCodeSent: boolean;
  isSendingCode: boolean;
  isCodeVerified: boolean;
  resendTimer: number;
  sentVerificationCode: string;
  onSendCode: () => void;
  onResendCode: () => void;
  onEmailChange: (value: string) => void;
}

const EmailVerificationSection = ({
  form,
  isLoginMode = false,
  isCodeSent,
  isSendingCode,
  isCodeVerified,
  resendTimer,
  sentVerificationCode,
  onSendCode,
  onResendCode,
  onEmailChange
}: EmailVerificationSectionProps) => {
  const t = useTranslations('Authorization');

  return (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-bold dark:text-white">{t('email')}</FormLabel>
            <div className="flex gap-2 w-full items-center">
              <FormControl className="w-full">
                <Input 
                  type="email"
                  placeholder={t('emailPlaceholder') || "example@email.com"} 
                  className="border-2 shadow-md dark:border-slate-600" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    onEmailChange(e.target.value);
                  }} 
                />
              </FormControl>
              {!isLoginMode && (
                <Button
                  type="button"
                  className="h-[42px] min-w-[120px] whitespace-nowrap"
                  onClick={onSendCode}
                  disabled={isSendingCode || isCodeSent}
                >
                  {isCodeSent ? t('codeSent') : isSendingCode ? t('sending') : t('sendCode')}
                </Button>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isLoginMode && isCodeSent && (
        <FormField
          control={form.control}
          name="verificationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold dark:text-white">{t('verificationCode')}</FormLabel>
              <FormControl>
                <div className="flex flex-col items-center gap-4">
                  <VerificationCodeInput
                    value={field.value || ''}
                    onChange={(value) => field.onChange(value)}
                    isValid={field.value === sentVerificationCode}
                    isInvalid={!!field.value && field.value !== sentVerificationCode}
                    disabled={isCodeVerified}
                  />
                  {isCodeVerified && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-2">
                      <CheckCircle size={16} />
                      {t('codeVerified')}
                    </p>
                  )}
                  {!isCodeVerified && (
                    <div className="flex justify-between items-center w-full mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('codeNotReceived')}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sm p-0 h-auto"
                        onClick={onResendCode}
                        disabled={resendTimer > 0 || isSendingCode}
                      >
                        {resendTimer > 0 ? `${t('resendIn')} ${resendTimer}s` : t('resendCode')}
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};

export default EmailVerificationSection;

