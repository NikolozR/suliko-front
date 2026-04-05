import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/components/ui/form";
import { Input } from "@/features/ui/components/ui/input";
import { Eye, EyeOff, CheckCircle, XCircle, Lock } from "lucide-react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { LoginFormData, RegisterFormData } from "@/features/auth/types/types.Auth";
import { useState } from "react";

interface PasswordSectionProps {
  form: UseFormReturn<LoginFormData | RegisterFormData>;
  isLoginMode: boolean;
  onForgotPassword?: () => void;
}

const PasswordSection = ({ form, isLoginMode, onForgotPassword }: PasswordSectionProps) => {
  const t = useTranslations("Authorization");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const passwordValue = useWatch({ control: form.control, name: "password" }) as string ?? "";

  const checks = [
    { label: t("passwordHintLength"), met: passwordValue.length >= 8 },
    { label: t("passwordHintDigit"), met: /\d/.test(passwordValue) },
    { label: t("passwordHintSpecial"), met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordValue) },
  ];

  return (
    <>
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            {/* Label row — Forgot password link sits inline on the right (login only) */}
            <div className="flex items-center justify-between">
              <FormLabel className="font-bold dark:text-white">
                {t("password")} <span className="text-red-500">*</span>
              </FormLabel>
              {isLoginMode && onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs text-suliko-default-color hover:underline cursor-pointer"
                >
                  {t("forgotPassword")}
                </button>
              )}
            </div>
            <FormControl>
              <div className="relative w-full">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  className="border-2 shadow-md dark:border-slate-600 pl-9 pr-10"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                  placeholder={t("passwordPlaceholder")}
                  {...field}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsPasswordVisible((p) => !p)}
                >
                  {isPasswordVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
            {!isLoginMode && (
              <ul className="mt-2 flex flex-col gap-1">
                {checks.map((check) => (
                  <li key={check.label} className="flex items-center gap-1.5 text-xs">
                    {check.met ? (
                      <CheckCircle size={13} className="text-green-500 shrink-0" />
                    ) : (
                      <XCircle size={13} className="text-muted-foreground shrink-0" />
                    )}
                    <span className={check.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                      {check.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </FormItem>
        )}
      />

      {!isLoginMode && (
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold dark:text-white">
                {t("confirmPassword")} <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative w-full">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    className="border-2 shadow-md dark:border-slate-600 pl-9 pr-10"
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    {...field}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={isConfirmPasswordVisible ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsConfirmPasswordVisible((p) => !p)}
                  >
                    {isConfirmPasswordVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
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

export default PasswordSection;
