import { FC, FormEvent, ChangeEvent } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Type } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import LanguageSelect from './LanguageSelect';
import React from 'react';

type TranslationResult = string | null;

interface TextTranslationCardProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  error: string | null;
  translationResult: TranslationResult;
  onSubmit: (e: FormEvent) => void;
  showAuthModal: () => void;
  token: string | null;
  languageId?: string | number;
  onLanguageChange?: (id: number) => void;
}
const TextTranslationCard: FC<TextTranslationCardProps> = ({ value, onChange, isLoading, error, translationResult, onSubmit, showAuthModal, token, languageId, onLanguageChange }) => {
  const [languageError, setLanguageError] = React.useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    if (!languageId) {
      e.preventDefault();
      setLanguageError('გთხოვთ, აირჩიეთ ენა');
      return;
    }
    setLanguageError(null);
    onSubmit(e);
  };

  return (
    <TabsContent value="text">
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Type className="h-5 w-5" />
            შეიყვანე ტექსტი
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            რამე ტექსტი თარგმნის აღწერისთვის
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {onLanguageChange && (
              <div className="mb-4">
                <LanguageSelect value={languageId} onChange={onLanguageChange} placeholder="აირჩიე ენა" />
              </div>
            )}
            <Textarea 
              className="min-h-[150px] mb-4 border-2 focus:border-suliko-default-color focus:ring-suliko-default-color" 
              placeholder="რამე საცაცილო ტექსტი..."
              value={value}
              onChange={onChange}
            />
            <Button 
              className="w-full text-white suliko-default-bg hover:opacity-90 transition-opacity" 
              size="lg"
              type="submit"
              disabled={isLoading || !languageId}
              onClick={e => {
                if (!token) {
                  e.preventDefault();
                  showAuthModal();
                }
              }}
            >
              {isLoading ? 'მუშავდება...' : 'თარგმნე'}
            </Button>
            {languageError && (
              <p className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">{languageError}</p>
            )}
          </form>
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
          )}
          {translationResult && (
            <div className="mt-4 p-3 rounded-md bg-green-100">
              <h4 className="font-semibold text-green-700">თარგმანის შედეგი:</h4>
              <pre className="mt-2 text-sm text-green-600 overflow-x-auto">{translationResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export type { TextTranslationCardProps, TranslationResult };
export default TextTranslationCard; 