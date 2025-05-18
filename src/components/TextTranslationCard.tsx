import { FC, FormEvent, useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Type } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import LanguageSelect from './LanguageSelect';
import React from 'react';
import { translateUserContent, TranslateUserContentParams } from '@/services/translationService';
import { useAuthStore } from '@/store/authStore';

type TranslationResult = string | null;

interface TextTranslationCardProps {
  showAuthModal: () => void;
  token: string | null;
  languageId?: string | number;
}
const TextTranslationCard: FC<TextTranslationCardProps> = ({ showAuthModal, token }) => {
  const [languageError, setLanguageError] = React.useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [textResult, setTextResult] = useState<TranslationResult>(null);
  const [textLoading, setTextLoading] = useState(false);
  const { languageId, setLanguageId } = useAuthStore();


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      showAuthModal();
      return;
    }
    setTextResult(null);
    if (!languageId) {
      event.preventDefault();
      setLanguageError('გთხოვთ, აირჩიეთ ენა');
      return;
    }
    setLanguageError(null);
    if (!textValue.trim()) {
      setTextError('გთხოვთ, შეიყვანოთ ტექსტი თარგმნისთვის.');
      return;
    }
    setTextLoading(true);
    try {
      const params: TranslateUserContentParams = {
        Description: textValue,
        LanguageId: languageId ?? 0,
        SourceLanguageId: 2,
        Files: [],
        IsPdf: false,
      };
      const result = await translateUserContent(params);
      console.log(result);
      setTextResult(typeof result === 'string' ? result : JSON.stringify(result));
    } catch (err) {
      if (err instanceof Error) {
        setTextError(err.message || 'An unexpected error occurred.');
      } else {
        setTextError('An unexpected error occurred.');
      }
    } finally {
      setTextLoading(false);
    }
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
            {setLanguageId && (
              <div className="mb-4">
                <LanguageSelect value={languageId} onChange={setLanguageId} placeholder="აირჩიე ენა" />
              </div>
            )}
            <Textarea 
              className="min-h-[150px] mb-4 border-2 focus:border-suliko-default-color focus:ring-suliko-default-color" 
              placeholder="რამე საცაცილო ტექსტი..."
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
            />
            <Button 
              className="w-full text-white suliko-default-bg hover:opacity-90 transition-opacity" 
              size="lg"
              type="submit"
              disabled={textLoading}
              onClick={e => {
                if (!token) {
                  e.preventDefault();
                  showAuthModal();
                }
              }}
            >
              {textLoading ? 'მუშავდება...' : 'თარგმნე'}
            </Button>
            {languageError && (
              <p className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">{languageError}</p>
            )}
          </form>
          {textError && (
            <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{textError}</p>
          )}
          {textResult && (
            <div className="mt-4 p-3 rounded-md bg-green-100">
              <h4 className="font-semibold text-green-700">თარგმანის შედეგი:</h4>
              <pre className="mt-2 text-sm text-green-600 overflow-x-auto">{textResult}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export type { TextTranslationCardProps, TranslationResult };
export default TextTranslationCard; 