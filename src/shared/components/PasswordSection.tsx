import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/components/ui/form";
import { Input } from "@/features/ui/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AuthFormData } from "@/features/auth/types/types.Auth";

interface PasswordSectionProps {
  form: UseFormReturn<AuthFormData>;
  isLoginMode: boolean;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
}

const PasswordSection = ({
  form,
  isLoginMode,
  isPasswordVisible,
  onTogglePasswordVisibility
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
                  placeholder={t('passwordPlaceholder')}
                  {...field}
                />
                {isPasswordVisible ? (
                  <Eye
                    size={25}
                    className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                    onClick={onTogglePasswordVisibility}
                  />
                ) : (
                  <EyeOff
                    size={25}
                    className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                    onClick={onTogglePasswordVisibility}
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
                    placeholder={t('confirmPasswordPlaceholder')}
                    {...field}
                  />
                  {isPasswordVisible ? (
                    <Eye
                      size={25}
                      className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                      onClick={onTogglePasswordVisibility}
                    />
                  ) : (
                    <EyeOff
                      size={25}
                      className="absolute cursor-pointer right-3 top-[50%] translate-y-[-50%]"
                      onClick={onTogglePasswordVisibility}
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