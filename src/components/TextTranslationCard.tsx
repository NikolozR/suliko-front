"use client";
import { FormEvent, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import LanguageSelect from "./LanguageSelect";
import React from "react";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "./AuthModal";
import { TranslateUserContentParams, TranslationResult } from "@/types/translation";
import { mockTranslateUserContent } from "@/services/mockTranslationService";



const TextTranslationCard = () => {
  const [textValue, setTextValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [textResult, setTextResult] = useState<TranslationResult>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { languageId, setLanguageId, token } = useAuthStore();
  
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setTextResult(null);
    if (languageId < 0) {
      event.preventDefault();
      setFormError("გთხოვთ, აირჩიეთ ენა");
      return;
    }
    if (!textValue.trim()) {
      setFormError("გთხოვთ, შეიყვანოთ ტექსტი თარგმნისთვის.");
      return;
    }
    setFormError(null);
    setTextLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const params: TranslateUserContentParams = {
        Description: textValue,
        LanguageId: languageId ?? 0,
        SourceLanguageId: 2,
        Files: [],
        IsPdf: false,
      };
      const result = await mockTranslateUserContent();
      // const result = await translateUserContent(params);
      // TODO: handle result
      setTextResult(
        typeof result === "string" ? result : JSON.stringify(result)
      );
    } catch (err) {
      console.log(err);
      setFormError("თარგმნის დროს დაფიქსირდა შეცდომა");
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
                <LanguageSelect
                  value={languageId}
                  onChange={setLanguageId}
                  placeholder="აირჩიე ენა"
                />
              </div>
            )}
            <Textarea
              className="min-h-[150px] mb-4 border-2 focus:border-suliko-default-color focus:ring-suliko-default-color"
              placeholder="რამე საცაცილო ტექსტი..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
            />
            <Button
              className="w-full text-white suliko-default-bg hover:opacity-90 transition-opacity"
              size="lg"
              type="submit"
              disabled={textLoading}
              onClick={(e) => {
                if (!token) {
                  e.preventDefault();
                  setShowAuthModal(true);
                }
              }}
            >
              {textLoading ? "მუშავდება..." : "თარგმნე"}
            </Button>
            {formError && (
              <p className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                {formError}
              </p>
            )}
          </form>
          {/* TODO: handle result, whole new logic */}
          {textResult && (
            <div className="mt-4 p-3 rounded-md bg-green-100">
              <h4 className="font-semibold text-green-700">
                თარგმანის შედეგი:
              </h4>
              <pre className="mt-2 text-sm text-green-600 overflow-x-auto">
                {textResult}
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
export default TextTranslationCard;
