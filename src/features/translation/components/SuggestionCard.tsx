import { Check, X, Flame, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suggestion } from "../types/types.Translation";
import { LoadingSpinner } from "@/features/ui/components/loading";
import { Textarea } from "@/features/ui/components/ui/textarea";

interface SuggestionCardProps {
  suggestion: Suggestion;
  isExactMatch: boolean;
  isLoading: boolean;
  onOpenPreview: () => void;
  onReject: () => void;
  onTextChange: (text: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  index?: number;
  t: ReturnType<typeof useTranslations>;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion: s,
  isExactMatch,
  isLoading,
  onOpenPreview,
  onReject,
  onTextChange,
  onMouseEnter,
  onMouseLeave,
  index = 0,
  t,
}) => (
  <div
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className="animate-slideUpScale bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col min-w-[320px] max-w-[400px] gap-2 shadow-sm hover:shadow-md hover:border-suliko-default-color/30 transition-all duration-200"
    style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
  >
    <div className="flex items-center justify-between gap-2">
      <div className="font-semibold text-foreground" title={s.title}>{s.title}</div>
      <div className="flex gap-1 items-center">
        <span
          className="p-1.5 rounded-md"
          title={
            isExactMatch
              ? t("SuggestionsPanel.indicatorExact", { default: "Exact match: quick apply" })
              : t("SuggestionsPanel.indicatorNonExact", { default: "Non-exact: server apply" })
          }
        >
          {isExactMatch
            ? <Flame className="w-4 h-4 text-orange-500" />
            : <Clock className="w-4 h-4 text-amber-500" />
          }
        </span>
        <button
          type="button"
          onClick={onOpenPreview}
          disabled={isLoading}
          className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          title={t("SuggestionsPanel.accept")}
        >
          {isLoading
            ? <LoadingSpinner size="sm" variant="primary" />
            : <Check className="w-4 cursor-pointer h-4 text-green-600 dark:text-green-500 group-hover:text-green-700 dark:group-hover:text-green-400" />
          }
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={isLoading}
          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          title={t("SuggestionsPanel.reject")}
        >
          <X className="w-4 cursor-pointer h-4 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
        </button>
      </div>
    </div>
    <div className="text-sm text-foreground mb-2 leading-relaxed">{s.description}</div>
    <Textarea
      value={s.suggestedText || ""}
      onChange={(e) => onTextChange(e.target.value)}
      className="text-xs font-mono resize-none min-h-[80px] max-h-[200px]"
      placeholder={t("SuggestionsPanel.editPlaceholder")}
      disabled={isLoading}
    />
  </div>
);
