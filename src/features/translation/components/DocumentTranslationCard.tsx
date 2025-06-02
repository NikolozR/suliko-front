"use client";
import { ChangeEvent, useState } from "react";
import { TabsContent } from "@/features/ui/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/features/ui/components/ui/card";
import { Upload } from "lucide-react";
import { Button } from "@/features/ui/components/ui/button";
import { useAuthStore } from "@/features/auth/store/authStore";
import { translateDocumentUserContent } from "@/features/translation/services/translationService";
import { AuthModal } from "@/features/auth";
import { DocumentTranslateUserContentParams } from "@/features/translation/types/types.Translation";
import { useDocumentTranslationStore } from "@/features/translation/store/documentTranslationStore";
import LanguageSelectionPanel from "./LanguageSelectionPanel";
import TranslationResultView from "./TranslationResultView";
import DocumentUploadView from "./DocumentUploadView";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

// Safe check for browser environment
const isFileListAvailable = typeof window !== 'undefined' && 'FileList' in window;

// Zod validation schema for document translation
const documentTranslationSchema = z.object({
  currentFile: z
    .any()
    .nullable()
    .refine((files) => {
      if (!files) return false;
      // Check if it's a FileList-like object or has the expected structure
      return (isFileListAvailable && files instanceof FileList && files.length > 0) || 
             (files && typeof files === 'object' && files.length > 0);
    }, "Please select a file to translate.")
    .refine(
      (files) => {
        if (!files || !files.length) return false;
        const file = files[0];
        return file && file.size <= 10 * 1024 * 1024; // 10MB limit
      },
      "File size must be less than 10MB."
    ),
  currentTargetLanguageId: z
    .number()
    .min(0, "გთხოვთ, აირჩიეთ სამიზნე ენა"),
  currentSourceLanguageId: z
    .number()
    .min(0, "გთხოვთ, აირჩიეთ წყარო ენა"),
});

type DocumentFormData = z.infer<typeof documentTranslationSchema>;

const DocumentTranslationCard = () => {
  const t = useTranslations('DocumentTranslationCard');
  const tTranslationButton = useTranslations('TranslationButton');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const { token } = useAuthStore();
  const {
    currentFile,
    setCurrentFile,
    translatedMarkdown,
    setTranslatedMarkdown,
    currentTargetLanguageId,
    setCurrentTargetLanguageId,
    currentSourceLanguageId,
    setCurrentSourceLanguageId,
  } = useDocumentTranslationStore();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
    reset,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentTranslationSchema),
    defaultValues: {
      currentFile: null,
      currentTargetLanguageId,
      currentSourceLanguageId,
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setCurrentFile(event.target.files);
      setValue("currentFile", event.target.files);
      clearErrors("currentFile");
    }
  };

  const handleRemoveFile = () => {
    setCurrentFile(null);
    setValue("currentFile", null);
    clearErrors("currentFile");
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!data.currentFile || data.currentFile.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const params: DocumentTranslateUserContentParams = {
        File: data.currentFile[0],
        TargetLanguageId: data.currentTargetLanguageId,
        SourceLanguageId: data.currentSourceLanguageId,
        OutputFormat: 0,
      };
      const result = await translateDocumentUserContent(params);
      setTranslatedMarkdown(result);
    } catch (err) {
      if (err instanceof Error) {
        // You could set form errors here if needed
        console.error(err.message || "An unexpected error occurred.");
      } else {
        console.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormError = () => {
    if (!token) {
      setShowAuthModal(true);
    }
  };

  const handleNewTranslation = () => {
    setTranslatedMarkdown("");
    setCurrentFile(null);
    reset({
      currentFile: null,
      currentTargetLanguageId,
      currentSourceLanguageId,
    });
    
    // Reset the file input element
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Get the first error message to display
  const getFormError = (): string | null => {
    if (errors.currentFile?.message) {
      return typeof errors.currentFile.message === 'string' ? errors.currentFile.message : 'Please select a file to translate.';
    }
    if (errors.currentTargetLanguageId?.message) {
      return typeof errors.currentTargetLanguageId.message === 'string' ? errors.currentTargetLanguageId.message : 'Please select a target language.';
    }
    if (errors.currentSourceLanguageId?.message) {
      return typeof errors.currentSourceLanguageId.message === 'string' ? errors.currentSourceLanguageId.message : 'Please select a source language.';
    }
    return null;
  };

  const hasFile = currentFile && currentFile.length > 0;
  const currentFileObj = hasFile ? currentFile[0] : null;

  return (
    <TabsContent value="document">
      <div className={translatedMarkdown ? "flex gap-8" : undefined}>
        <Card className="border-none flex-1 min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit, handleFormError)}>
              {translatedMarkdown ? (
                <>
                  <LanguageSelectionPanel
                    targetLanguageId={currentTargetLanguageId}
                    sourceLanguageId={currentSourceLanguageId}
                    onTargetLanguageChange={(value) => {
                      setCurrentTargetLanguageId(value);
                      setValue("currentTargetLanguageId", value);
                      clearErrors("currentTargetLanguageId");
                    }}
                    onSourceLanguageChange={(value) => {
                      setCurrentSourceLanguageId(value);
                      setValue("currentSourceLanguageId", value);
                      clearErrors("currentSourceLanguageId");
                    }}
                    layout="horizontal"
                  />
                  
                  <TranslationResultView
                    currentFile={currentFileObj!}
                    translatedMarkdown={translatedMarkdown}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                  />
                </>
              ) : (
                <div className="flex gap-2 md:gap-4 items-end flex-col md:flex-row">
                  <div className="w-full md:flex-1 min-w-0">
                    <LanguageSelectionPanel
                      targetLanguageId={currentTargetLanguageId}
                      sourceLanguageId={currentSourceLanguageId}
                      onTargetLanguageChange={(value) => {
                        setCurrentTargetLanguageId(value);
                        setValue("currentTargetLanguageId", value);
                        clearErrors("currentTargetLanguageId");
                      }}
                      onSourceLanguageChange={(value) => {
                        setCurrentSourceLanguageId(value);
                        setValue("currentSourceLanguageId", value);
                        clearErrors("currentSourceLanguageId");
                      }}
                      layout="horizontal"
                    />

                    <DocumentUploadView
                      currentFile={currentFileObj}
                      onFileChange={handleFileChange}
                      onRemoveFile={handleRemoveFile}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-4 text-white suliko-default-bg hover:opacity-90 transition-opacity text-sm md:text-base"
                size={translatedMarkdown ? "default" : "lg"}
                disabled={isLoading || !hasFile}
              >
                <span className="text-sm md:text-base">
                  {isLoading ? tTranslationButton('loading') : tTranslationButton('translate')}
                </span>
              </Button>
              
              {translatedMarkdown && (
                <Button
                  onClick={handleNewTranslation}
                  variant="outline"
                  className="w-full mt-2"
                  type="button"
                >
                  ახალი თარგმნა
                </Button>
              )}

              {getFormError() && (
                <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">
                  {getFormError()}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </TabsContent>
  );
};

export default DocumentTranslationCard;
