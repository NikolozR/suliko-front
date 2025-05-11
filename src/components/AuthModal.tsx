'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignIn, onSignUp }) => {
  if (!isOpen) return null;

  const handleSignInClick = () => {
    onSignIn();
    onClose(); 
  };

  const handleSignUpClick = () => {
    onSignUp();
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit rounded-lg py-[40px] px-[70px]">
        <DialogHeader>
          <DialogTitle className="text-center">Authentication Required</DialogTitle>
          <DialogDescription className="text-center">
            Please sign in or sign up to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex !justify-center items-center gap-2 mt-4">
          <Button 
            onClick={handleSignInClick} 
            className="cursor-pointer suliko-default-bg text-white hover:opacity-90"
          >
            Sign In
          </Button>
          <Button 
            onClick={handleSignUpClick} 
            variant="outline"
            className="cursor-pointer"
          >
            Sign Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 