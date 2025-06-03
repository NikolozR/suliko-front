import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose}) => {
  const t = useTranslations("AuthModal");
  const router = useRouter();
  
  
  
  if (!isOpen) return null;


  const handleSignUpClick = () => {
    router.push("/sign-in");
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit rounded-lg py-[40px] px-[70px]">
        <DialogHeader>
          <DialogTitle className="text-center">{t("title")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex !justify-center items-center gap-2 mt-4">
          <Button 
            onClick={handleSignUpClick} 
            className="cursor-pointer"
          >
            {t("login")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 