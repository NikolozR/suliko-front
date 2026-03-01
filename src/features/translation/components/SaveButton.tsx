"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";

interface SaveButtonProps {
  onSave: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const SaveButton: React.FC<SaveButtonProps> = ({
  onSave,
  disabled = false,
  className = "",
  size = "sm",
  variant = "outline",
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (disabled || isSaving) return;

    try {
      setIsSaving(true);
      await onSave();
      setSaved(true);

      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleSave}
      disabled={disabled || isSaving}
      className={`transition-all duration-200 ${className}`}
    >
      {saved ? (
        <Check className="h-4 w-4 mr-1" />
      ) : (
        <Save className="h-4 w-4 mr-1" />
      )}
      {isSaving && <span className="ml-2 text-xs">Saving...</span>}
    </Button>
  );
};

export default SaveButton;