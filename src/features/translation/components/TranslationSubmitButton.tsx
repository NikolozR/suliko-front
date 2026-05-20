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
  onTranslateMore?: () => void;
  type?: "button" | "submit";
  isHighlighted?: boolean;
}

const TranslationSubmitButton: React.FC<TranslationSubmitButtonProps> = ({
  isLoading,
  disabled = false,
  hasResult = false,
  formError = null,
  showShiftEnter = true,
  onClick,
  onTranslateMore,
  type = "submit",
  isHighlighted = false
}) => {
  const t = useTranslations('TranslationButton');
  const tTextCard = useTranslations('TextTranslationCard');

  const buttonClassName = `w-full mt-4 text-white suliko-default-bg hover:opacity-90 transition-all duration-300 text-sm md:text-base ${
    isHighlighted
      ? "animate-pulse ring-4 ring-suliko-default-color/30 shadow-lg shadow-suliko-default-color/25 brightness-110"
      : ""
  }`;

  if (hasResult && onTranslateMore) {
    return (
      <button
        type="button"
        onClick={onTranslateMore}
        className="w-full mt-4 flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-suliko-default-color/40 text-suliko-default-color hover:border-suliko-default-color hover:bg-suliko-default-color/5 transition-all duration-200 py-2.5 text-sm md:text-base font-medium"
      >
        <span>+</span>
        {t('translateMore')}
      </button>
    );
  }

  return (
    <>
      <LoadingButton
        className={buttonClassName}
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