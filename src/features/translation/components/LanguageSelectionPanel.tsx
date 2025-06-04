"use client";
import { useTranslations } from "next-intl";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import LanguageSelect from "./LanguageSelect";

interface LanguageSelectionPanelProps {
  targetLanguageId: number;
  sourceLanguageId: number;
  onTargetLanguageChange: (languageId: number) => void;
  onSourceLanguageChange: (languageId: number) => void;
  layout?: "horizontal" | "vertical";
  showSwapButton?: boolean;
}

const LanguageSelectionPanel: React.FC<LanguageSelectionPanelProps> = ({
  targetLanguageId,
  sourceLanguageId,
  onTargetLanguageChange,
  onSourceLanguageChange,
  layout = "horizontal",
  showSwapButton = false
}) => {
  const t = useTranslations('CommonLanguageSelect');
  const containerClasses = layout === "horizontal" 
    ? "flex gap-2 md:gap-4 flex-col sm:flex-row items-end mb-6"
    : "flex gap-2 md:gap-4 flex-col sm:flex-row md:flex-col items-end mb-6";

  const handleSwapLanguages = () => {
    if (sourceLanguageId !== 0) {
      const tempSource = sourceLanguageId;
      const tempTarget = targetLanguageId;
      
      onSourceLanguageChange(tempTarget);
      onTargetLanguageChange(tempSource);
    }
  };

  return (
    <div className={containerClasses}>
      <div className="w-full sm:flex-1">
        <span className="block text-xs text-muted-foreground mb-1">
          {t('sourceLanguageQuestion')}?
        </span>
        <LanguageSelect
          value={sourceLanguageId}
          onChange={onSourceLanguageChange}
          placeholder={t('selectLanguagePlaceholder')}
          detectOption={t('automaticDetection')}
        />
      </div>
      
      {showSwapButton && (
        <div className="flex items-end justify-center sm:justify-center w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 border-2 hover:border-suliko-default-color hover:text-suliko-default-color transition-colors"
            disabled={sourceLanguageId === 0}
            onClick={handleSwapLanguages}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="w-full sm:flex-1">
        <span className="block text-xs text-muted-foreground mb-1">
          {t('targetLanguageQuestion')}?
        </span>
        <LanguageSelect
          value={targetLanguageId}
          onChange={onTargetLanguageChange}
          placeholder={t('selectLanguagePlaceholder')}
        />
      </div>
    </div>
  );
};

export default LanguageSelectionPanel; 