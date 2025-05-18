"use client";
import { FC, useState, ChangeEvent, FormEvent } from "react";
import { Upload, Type } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { translateUserContent } from "../services/translationService";
import { useAuthStore } from "../store/authStore";
import { AuthModal } from "./AuthModal";
import { useRouter } from "next/navigation";
import TextTranslationCard, { TranslationResult } from "./TextTranslationCard";
import DocumentTranslationCard from "./DocumentTranslationCard";
import RecentDocumentsCard from "./RecentDocumentsCard";

const MainContent: FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [translationResult, setTranslationResult] =
    useState<TranslationResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const { token } = useAuthStore();
  const router = useRouter();

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
      const params = {
        Description: "",
        LanguageId: 1,
        SourceLanguageId: 2,
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

  const handleSignIn = () => {
    router.push("/sign-up");
  };

  const handleSignUp = () => {
    router.push("/sign-up");
  };

  return (
    <div className="min-h-screen p-8 bg-suliko-main-content-bg-color">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">თარჯიმანი</h1>
          <p className="text-muted-foreground mt-2">აირჩიე მეთოდი</p>
        </div>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger
              value="text"
              className="cursor-pointer flex items-center gap-2 data-[state=active]:!bg-suliko-default-color data-[state=active]:text-white"
            >
              <Type className="h-5 w-5" />
              ტექსტი
            </TabsTrigger>
            <TabsTrigger
              value="document"
              className="cursor-pointer flex items-center gap-2 data-[state=active]:!bg-suliko-default-color data-[state=active]:text-white"
            >
              <Upload className="h-5 w-5" />
              დოკუმენტი
            </TabsTrigger>
          </TabsList>
          <TextTranslationCard
            showAuthModal={() => setShowAuthModal(true)}
            token={token}
          />
          <DocumentTranslationCard
            files={files}
            isLoading={isLoading}
            error={error}
            translationResult={translationResult}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
          />
        </Tabs>
        <RecentDocumentsCard />
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    </div>
  );
};

export default MainContent;
