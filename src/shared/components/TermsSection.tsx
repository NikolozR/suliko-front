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
  DialogTitle,
  DialogTrigger,
} from "@/features/ui/components/ui/dialog";
import { LoginFormData, RegisterFormData } from "@/features/auth/types/types.Auth";

interface TermsSectionProps {
  form: UseFormReturn<LoginFormData | RegisterFormData>;
}

function parseDocumentSections(text: string) {
  const blocks = text.split(/\n\n+/);
  const sections: { heading: string | null; body: string }[] = [];
  let current: { heading: string | null; body: string } | null = null;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const isHeading = /^\d+\.\s/.test(trimmed) && trimmed.split("\n").length === 1;
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: trimmed, body: "" };
    } else {
      if (current) {
        current.body += (current.body ? "\n\n" : "") + trimmed;
      } else {
        sections.push({ heading: null, body: trimmed });
      }
    }
  }
  if (current) sections.push(current);
  return sections;
}

function DocumentText({ text }: { text: string }) {
  const sections = parseDocumentSections(text);
  return (
    <div className="space-y-5">
      {sections.map((section, i) => (
        <div key={i}>
          {section.heading && (
            <h4 className="font-semibold text-gray-900 mb-1.5">{section.heading}</h4>
          )}
          {section.body && (
            <p className="text-gray-900 leading-7 whitespace-pre-wrap text-sm">{section.body}</p>
          )}
        </div>
      ))}
    </div>
  );
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
                  <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
                    {/* Header */}
                    <div className="px-8 py-5 border-b border-gray-100 bg-white rounded-t-lg">
                      <DialogTitle className="text-xl font-bold text-gray-900">
                        {t("termsAndPrivacy")}
                      </DialogTitle>
                      <p className="text-xs text-gray-500 mt-1">შკს სულიკო ეი აი · ID: 400403265</p>
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto px-8 py-6 space-y-8 bg-gray-50">

                      {/* Terms */}
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px flex-1 bg-gray-100" />
                          <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                            {t("termsAndConditions")}
                          </span>
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        <DocumentText text={t("termsText")} />
                      </section>

                      {/* Privacy */}
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-px flex-1 bg-gray-100" />
                          <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                            {t("privacyPolicy")}
                          </span>
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        <DocumentText text={t("privacyText")} />
                      </section>
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
