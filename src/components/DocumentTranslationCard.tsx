import { FC, ChangeEvent, FormEvent } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type TranslationResult = string | null;

interface DocumentTranslationCardProps {
  files: FileList | null;
  isLoading: boolean;
  error: string | null;
  translationResult: TranslationResult;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}
const DocumentTranslationCard: FC<DocumentTranslationCardProps> = ({ files, isLoading, error, translationResult, onFileChange, onSubmit }) => (
  <TabsContent value="document">
    <Card className="border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Upload className="h-5 w-5" />
          ატვირთე დოკუმენტი
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          ატვირთეთ ფაილი თარგმნისთვის. (PDF, DOCX, TXT, და ა.შ.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <Label htmlFor="file-upload" className='w-full block'>
            <div className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-suliko-default-color transition-colors cursor-pointer">
              <div className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {files && files.length > 0 ? files[0].name : "Drag and drop your file here, or click to select"}
                </p>
                <Input 
                  type="file" 
                  className="hidden" 
                  id="file-upload"
                  onChange={onFileChange}
                />
              </div>
            </div>
          </Label>
          <Button 
            type="submit"
            className="cursor-pointer w-full mt-4 text-white suliko-default-bg hover:opacity-90 transition-opacity" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'მუშავდება...' : 'თარგმნე'}
          </Button>
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

export type { DocumentTranslationCardProps, TranslationResult };
export default DocumentTranslationCard; 