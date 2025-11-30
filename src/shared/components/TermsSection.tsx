"use client";
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/features/ui/components/ui/form";
import { Checkbox } from "@/features/ui/components/ui/checkbox";
import { Button } from "@/features/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/features/ui/components/ui/dialog";
import { LoginFormData, RegisterFormData } from "@/features/auth/types/types.Auth";

interface TermsSectionProps {
  form: UseFormReturn<LoginFormData | RegisterFormData>;
}

const TermsSection: React.FC<TermsSectionProps> = ({ form }) => {
  const t = useTranslations("Authorization");
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="acceptTerms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;
                  field.onChange(isChecked);
                  // Also set privacy policy to the same value
                  form.setValue("acceptPrivacyPolicy", isChecked, { shouldValidate: true });
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-sm font-normal cursor-pointer">
                {t("iAcceptThe")}{" "}
                <span className="text-red-500">*</span>{" "}
                <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-blue-600 underline text-sm"
                    >
                      {t("termsAndPrivacy")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t("termsAndPrivacy")}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 text-sm">
                      <h3 className="font-semibold">{t("termsAndConditions")}</h3>
                      <p className="whitespace-pre-wrap">{t("termsText")}</p>
                      <h3 className="font-semibold mt-8">{t("privacyPolicy")}</h3>
                      <p className="whitespace-pre-wrap">{t("privacyText")}</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="subscribeNewsletter"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-sm font-normal cursor-pointer">
                {t("subscribeNewsletter")}
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default TermsSection;