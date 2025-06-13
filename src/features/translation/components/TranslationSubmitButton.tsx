"use client";
import { LoadingButton } from "@/features/ui/components/loading";
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
      <LoadingButton
        className="w-full mt-4 text-white suliko-default-bg hover:opacity-90 transition-opacity text-sm md:text-base"
        size={hasResult ? "default" : "lg"}
        type={type}
        disabled={disabled}
        isLoading={isLoading}
        onClick={onClick}
        loadingText={t('loading')}
        loadingAnimation="spinner"
        fullWidth={true}
      >
        <span className="text-sm md:text-base">
          {t('translate')}
        </span>
      </LoadingButton>
      
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