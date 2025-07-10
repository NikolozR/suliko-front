"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import markdownToTxt from 'markdown-to-txt'

interface CopyButtonProps {
  content: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const CopyButton: React.FC<CopyButtonProps> = ({
  content,
  className = "",
  size = "sm",
  variant = "outline"
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const plainText = markdownToTxt(content);
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`transition-all duration-200 ${className}`}
      disabled={!content.trim()}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-1" />
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-1" />
        </>
      )}
    </Button>
  );
};

export default CopyButton; 