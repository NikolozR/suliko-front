"use client";
import { ChangeEvent, FormEvent, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { translateUserContent } from "@/services/translationService";
import { AuthModal } from "./AuthModal";
import { TranslationResult, TranslateUserContentParams } from "@/types/translation";

const DocumentTranslationCard = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [translationResult, setTranslationResult] =
    useState<TranslationResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const { token, languageId } = useAuthStore();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(event.target.files);
      if (event.target.files.length > 0) {
        setIsPdf(event.target.files[0].type === "application/pdf");
      }
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      setShowAuthModal(true);
      return;
    }

    setError(null);
    setTranslationResult(null);

    if (!files || files.length === 0) {
      setError("Please select a file to translate.");
      return;
    }

    setIsLoading(true);
    try {
      const params: TranslateUserContentParams = {
        Description: "",
        LanguageId: 1,
        SourceLanguageId: languageId ?? 0,
        Files: Array.from(files),
        IsPdf: isPdf,
      };
      const result = await translateUserContent(params);
      setTranslationResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <form onSubmit={handleSubmit}>
            <Label htmlFor="file-upload" className="w-full block">
              <div className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-suliko-default-color transition-colors cursor-pointer">
                <div className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {files && files.length > 0
                      ? files[0].name
                      : "Drag and drop your file here, or click to select"}
                  </p>
                  <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileChange}
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
              {isLoading ? "მუშავდება..." : "თარგმნე"}
            </Button>
          </form>
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">
              {error}
            </p>
          )}
          {translationResult && (
            <div className="mt-4 p-3 rounded-md bg-green-100">
              <h4 className="font-semibold text-green-700">
                თარგმანის შედეგი:
              </h4>
              <pre className="mt-2 text-sm text-green-600 overflow-x-auto">
                {translationResult}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </TabsContent>
  );
};

export type { TranslationResult };
export default DocumentTranslationCard;
