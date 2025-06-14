import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Suggestion } from '../types/types.Translation';
import { useSuggestionsStore } from '../store/suggestionsStore';
import { applySuggestion } from '../services/suggestionsService';
import { useDocumentTranslationStore } from '../store/documentTranslationStore';
import { LoadingSpinner } from '@/features/ui/components/loading';
import { Textarea } from '@/features/ui/components/ui/textarea';

const SuggestionsPanel: React.FC = () => {
  const {suggestions, removeSuggestion, acceptSuggestion, updateSuggestionText} = useSuggestionsStore();
  const {translatedMarkdown, currentTargetLanguageId, setTranslatedMarkdown} = useDocumentTranslationStore();
  const [loadingSuggestionId, setLoadingSuggestionId] = useState<string | null>(null);

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

  if (!suggestions.length) return null;

  return (
    <div className="w-[340px] min-w-[280px] max-w-[400px]">
      <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
        შემოთავაზებები
      </div>
      <aside className="h-[800px] max-h-[800px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <p className="text-xs text-muted-foreground">{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} available</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500">
          <div className="space-y-4">
            {suggestions.map((s: Suggestion) => (
              <div key={s.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-suliko-default-color/30 transition-all duration-200">
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
        </div>
      </aside>
    </div>
  );
};

export default SuggestionsPanel; 