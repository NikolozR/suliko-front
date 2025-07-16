import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Suggestion } from '../types/types.Translation';
import { useSuggestionsStore } from '../store/suggestionsStore';
import { applySuggestion } from '../services/suggestionsService';
import { useDocumentTranslationStore } from '../store/documentTranslationStore';
import { LoadingSpinner } from '@/features/ui/components/loading';
import { Textarea } from '@/features/ui/components/ui/textarea';
import { settingUpSuggestions } from '../utils/settingUpSuggestions';

const SuggestionsPanel: React.FC = () => {
  const { 
    suggestions, 
    removeSuggestion, 
    acceptSuggestion, 
    updateSuggestionText,
    hasGeneratedMore,
    setHasGeneratedMore
  } = useSuggestionsStore();
  const { translatedMarkdown, currentTargetLanguageId, setTranslatedMarkdown, jobId } = useDocumentTranslationStore();
  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(null);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);

  const handleRemoveSuggestion = (id: string) => {
    removeSuggestion(id);
  };

  const handleAcceptSuggestion = async (id: string) => {
    setLoadingSuggestionId(id);
    try {
      const data = await applySuggestion({
        translatedContent: translatedMarkdown,
        suggestionId: id,
        suggestion: suggestions.find((s: Suggestion) => s.id === id)!,
        targetLanguageId: currentTargetLanguageId,
      });
      setTranslatedMarkdown(data.updatedContent);
      acceptSuggestion(id);
    } catch (error) {
      console.error('Error applying suggestion:', error);
    } finally {
      setLoadingSuggestionId(null);
    }
  };

  const handleSuggestionTextChange = (id: string, newText: string) => {
    updateSuggestionText(id, newText);
  };

  const handleGenerateMore = async () => {
    if (!jobId || hasGeneratedMore) return;
    
    setIsGeneratingMore(true);
    try {
      await settingUpSuggestions(jobId);
      setHasGeneratedMore(true);
    } catch (error) {
      console.error('Error generating more suggestions:', error);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  if (!suggestions.length) return null;

  return (
    <div className="w-full mt-6">
      <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
        შემოთავაზებები
      </div>
      <div className="flex flex-row gap-4 overflow-x-auto pb-2">
        {suggestions.map((s: Suggestion) => (
          <div key={s.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col min-w-[320px] max-w-[400px] gap-2 shadow-sm hover:shadow-md hover:border-suliko-default-color/30 transition-all duration-200">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-foreground" title={s.title}>{s.title}</div>
              <div className="flex gap-1">
                <button
                  type='button'
                  onClick={() => handleAcceptSuggestion(s.id)}
                  disabled={loadingSuggestionId === s.id}
                  className="p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Accept"
                >
                  {loadingSuggestionId === s.id ? (
                    <LoadingSpinner size="sm" variant="primary" />
                  ) : (
                    <Check className="w-4 cursor-pointer h-4 text-green-600 dark:text-green-500 group-hover:text-green-700 dark:group-hover:text-green-400" />
                  )}
                </button>
                <button
                  type='button'
                  onClick={() => handleRemoveSuggestion(s.id)}
                  disabled={loadingSuggestionId === s.id}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reject"
                >
                  <X className="w-4 cursor-pointer h-4 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                </button>
              </div>
            </div>
            <div className="text-sm text-foreground mb-2 leading-relaxed">{s.description}</div>
            <Textarea
              value={s.suggestedText}
              onChange={(e) => handleSuggestionTextChange(s.id, e.target.value)}
              className="text-xs font-mono resize-none min-h-[80px] max-h-[200px]"
              placeholder="Edit suggestion text..."
              disabled={loadingSuggestionId === s.id}
            />
          </div>
        ))}
      </div>
      {/* Generate More Suggestions Button below and left-aligned */}
      <div className="mt-3 flex justify-start">
        <button
          type="button"
          onClick={handleGenerateMore}
          disabled={isGeneratingMore || !jobId || hasGeneratedMore}
          className="min-w-[320px] max-w-[400px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-suliko-default-color/40 rounded-lg p-3 text-suliko-default-color font-semibold text-base shadow-sm hover:bg-suliko-default-color/10 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingMore ? (
            <LoadingSpinner size="sm" variant="primary" />
          ) : hasGeneratedMore ? (
            'No More Suggestions Available'
          ) : (
            '+ Generate More Suggestions'
          )}
        </button>
      </div>
    </div>
  );
};

export default SuggestionsPanel; 