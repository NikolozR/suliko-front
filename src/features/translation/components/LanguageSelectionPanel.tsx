"use client";
import { useTranslations } from "next-intl";
import LanguageSelect from "./LanguageSelect";

interface LanguageSelectionPanelProps {
  targetLanguageId: number;
  sourceLanguageId: number;
  onTargetLanguageChange: (languageId: number) => void;
  onSourceLanguageChange: (languageId: number) => void;
  layout?: "horizontal" | "vertical";
}

const LanguageSelectionPanel: React.FC<LanguageSelectionPanelProps> = ({
  targetLanguageId,
  sourceLanguageId,
  onTargetLanguageChange,
  onSourceLanguageChange,
  layout = "horizontal"
}) => {
  const t = useTranslations('CommonLanguageSelect');
  const containerClasses = layout === "horizontal" 
    ? "flex gap-2 md:gap-4 flex-col sm:flex-row mb-6"
    : "flex gap-2 md:gap-4 flex-col sm:flex-row md:flex-col mb-6";

  return (
    <div className={containerClasses}>
      <div className="w-full sm:flex-1">
        <span className="block text-xs text-muted-foreground mb-1">
          {t('targetLanguageQuestion')}?
        </span>
        <LanguageSelect
          value={targetLanguageId}
          onChange={onTargetLanguageChange}
          placeholder="აირჩიე ენა"
        />
      </div>
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
    </div>
  );
};

export default LanguageSelectionPanel; 