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

  const toPlainText = (value: string): string => {
    const source = value || "";
    // If likely HTML, strip tags via DOM parsing for accurate text
    if (/[<>]/.test(source)) {
      const container = document.createElement('div');
      container.innerHTML = source;
      return container.textContent || container.innerText || "";
    }
    // Otherwise treat as Markdown
    return markdownToTxt(source);
  };

  const handleCopy = async () => {
    const textToCopy = toPlainText(content);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-secure contexts or when clipboard API is unavailable
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textarea);
        }
      }
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