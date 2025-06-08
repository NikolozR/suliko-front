import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/features/ui/components/ui/form";
import { Input } from "@/features/ui/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { LoginFormData, RegisterFormData } from "@/features/auth/types/types.Auth";

interface NameSectionProps {
  form: UseFormReturn<LoginFormData | RegisterFormData>;
}

const NameSection = ({ form }: NameSectionProps) => {
  const t = useTranslations('Authorization');

  return (
    <div className="flex gap-4">
      <FormField
        control={form.control}
        name="firstname"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel className="font-bold dark:text-white">{t('firstname')} ({t('optional')})</FormLabel>
            <FormControl>
              <Input
                placeholder={t('firstnamePlaceholder')}
                className="border-2 shadow-md dark:border-slate-600"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="lastname"
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel className="font-bold dark:text-white">{t('lastname')} ({t('optional')})</FormLabel>
            <FormControl>
              <Input
                placeholder={t('lastnamePlaceholder')}
                className="border-2 shadow-md dark:border-slate-600"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default NameSection; 