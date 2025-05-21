import React, { useEffect, useState } from "react";
import { getAllLanguages, Language } from "@/services/languageService";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "./AuthModal";

interface LanguageSelectProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder: string;
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);

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
          <SelectTrigger className="cursor-pointer w-[220px]">
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
        value={value ? (value >= 0 ? value?.toString() : "") : ""}
        onValueChange={(val) => onChange(Number(val))}
        open={open}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger className="cursor-pointer w-[220px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="cursor-pointer">
          {languages.map((lang) => (
            <SelectItem
              className="cursor-pointer"
              key={lang.id}
              value={lang.id.toString()}
            >
              {lang.nameGeo}
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
