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
import { signIn, signUp } from "@/lib/utils";
import { useRouter } from "next/navigation";


interface LanguageSelectProps {
  value?: string | number;
  onChange: (value: number) => void;
  placeholder?: string;
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({
  value,
  onChange,
  placeholder = "Select language",
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getAllLanguages()
      .then((data) => {
        setLanguages(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="text-sm text-muted-foreground">Loading languages...</div>
    );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !token) {
      setShowAuthModal(true);
      return;
    }
    setOpen(nextOpen);
  };

  return (
    <>
      <Select
        value={value?.toString()}
        onValueChange={val => onChange(Number(val))}
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
        onSignIn={() => signIn(router)}
        onSignUp={() => signUp(router)}
      />
    </>
  );
};

export default LanguageSelect;
