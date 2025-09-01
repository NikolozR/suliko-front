import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/components/ui/form";
import { Input } from "@/features/ui/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { LoginFormData, RegisterFormData } from "@/features/auth/types/types.Auth";

interface PasswordSectionProps {
  form: UseFormReturn<LoginFormData | RegisterFormData>;
  isLoginMode: boolean;
  isPasswordVisible: boolean;
  setIsPasswordVisible: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const PasswordSection = ({
  form,
  isLoginMode,
  isPasswordVisible,
  setIsPasswordVisible,
}: PasswordSectionProps) => {
  const t = useTranslations('Authorization');

  return (
    <>
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-bold dark:text-white">{t('password')}</FormLabel>
            <FormControl>
              <div className="relative w-full">
                <Input
                  className="border-2 shadow-md dark:border-slate-600"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                  placeholder={t('passwordPlaceholder')}
                  {...field}
                />
                {isPasswordVisible ? (
                  <Eye
                    size={25}
                    className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                  />
                ) : (
                  <EyeOff
                    size={25}
                    className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                  />
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {!isLoginMode && (
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold dark:text-white">{t('confirmPassword')}</FormLabel>
              <FormControl>
                <div className="relative w-full">
                  <Input
                    className="border-2 shadow-md dark:border-slate-600"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    {...field}
                  />
                  {isPasswordVisible ? (
                    <Eye
                      size={25}
                      className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                    />
                  ) : (
                    <EyeOff
                      size={25}
                      className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                      onClick={() => setIsPasswordVisible((prev) => !prev)}
                    />
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

export default PasswordSection; 