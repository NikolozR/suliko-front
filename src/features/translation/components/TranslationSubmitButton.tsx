"use client";
import { Button } from "@/features/ui/components/ui/button";
import { useTranslations } from "next-intl";

interface TranslationSubmitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  hasResult?: boolean;
  formError?: string | null;
  showShiftEnter?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
}

const TranslationSubmitButton: React.FC<TranslationSubmitButtonProps> = ({
  isLoading,
  disabled = false,
  hasResult = false,
  formError = null,
  showShiftEnter = true,
  onClick,
  type = "submit"
}) => {
  const t = useTranslations('TranslationButton');
  const tTextCard = useTranslations('TextTranslationCard');

  return (
    <>
      <Button
        className="w-full mt-4 text-white suliko-default-bg hover:opacity-90 transition-opacity text-sm md:text-base"
        size={hasResult ? "default" : "lg"}
        type={type}
        disabled={isLoading || disabled}
        onClick={onClick}
      >
        <span className="text-sm md:text-base">
          {isLoading ? t('loading') : t('translate')}
        </span>
      </Button>
      
      {showShiftEnter && (
        <div className="flex justify-center mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {tTextCard('orPress')}{' '}
            <kbd className="px-1 py-0.5 bg-muted border border-border rounded text-xs font-mono">
              Shift + Enter
            </kbd>
          </span>
        </div>
      )}
      
      {formError && (
        <div className="text-red-500 text-sm mt-2">{formError}</div>
      )}
    </>
  );
};

export default TranslationSubmitButton; 