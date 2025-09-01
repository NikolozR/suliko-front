import React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/features/ui/components/ui/dialog";
import { Button } from "@/features/ui/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("AuthModal");
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignUpClick = () => {
    router.push("/sign-in");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit rounded-lg pt-[40px] pb-[32px] px-[70px]">
        <DialogHeader>
          <DialogTitle className="text-center">{t("title")}</DialogTitle>
        </DialogHeader>
        <DialogFooter className="flex !justify-center items-center gap-2 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="cursor-pointer text-red-600 dark:text-red-500"
          >
            {t("close")}
          </Button>
          <Button onClick={handleSignUpClick} className="cursor-pointer">
            {t("login")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
