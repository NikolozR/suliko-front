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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose}) => {
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
          <DialogTitle className="text-center">გთხოვთ გაიაროთ რეგისტრაცია</DialogTitle>
          <DialogDescription className="text-center">
            გთხოვთ გაიაროთ რეგისტრაცია თარგმნის მიზნით
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex !justify-center items-center gap-2 mt-4">
          <Button 
            onClick={handleSignUpClick} 
            className="cursor-pointer"
          >
            შესვლა
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 