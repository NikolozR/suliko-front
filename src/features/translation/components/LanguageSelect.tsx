import React, { useEffect, useState } from "react";
import { getAllLanguages, Language } from "@/features/translation/services/languageService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/features/ui/components/ui/select";
import { useAuthStore } from "@/features/auth/store/authStore";
import { AuthModal } from "@/features/auth";
import { useLocale } from 'next-intl';

interface LanguageSelectProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder: string;
  detectOption?: string;
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({
  value,
  onChange,
  placeholder,
  detectOption,
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const data = await getAllLanguages();
        setLanguages(data);
      } catch {
        setLanguages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  if (loading)
    return (
      <div className="text-sm text-muted-foreground">იტვირთება...</div>
    );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !token) {
      setShowAuthModal(true);
      return;
    }
    setOpen(nextOpen);
  };

  if (languages.length === 0) {
    return (
      <>
        <Select open={open} onOpenChange={handleOpenChange}>
          <SelectTrigger className="cursor-pointer w-full min-w-0">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </Select>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <Select
        value={value !== undefined ? (value >= 0 ? value?.toString() : "") : ""}
        onValueChange={(val) => onChange(Number(val))}
        open={open}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger className="cursor-pointer w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="cursor-pointer">
          {detectOption && (
            <SelectItem className="cursor-pointer" key={0} value={"0"}>
              {detectOption}
            </SelectItem>
          )}
          {languages.map((lang) => (
            <SelectItem
              className="cursor-pointer"
              key={lang.id}
              value={lang.id.toString()}
            >
              {(() => {
                // Handle edge case for "Serbian language"
                if (locale !== "ka" && lang.name === "Serbian language") {
                  return "Serbian";
                }
                return locale === "ka" ? lang.nameGeo : lang.name.replace(" Language", "");
              })()}
              {/* {locale === "ka" ? lang.nameGeo : lang.name.replace(" Language", "")} */}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default LanguageSelect;
