import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose}) => {
  const router = useRouter();
  
  if (!isOpen) return null;


  const handleSignUpClick = () => {
    router.push("/sign-up");
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
            onClick={handleSignUpClick} 
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