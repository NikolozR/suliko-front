"use client";
import { FormEvent, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Type } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import LanguageSelect from "./LanguageSelect";
import React from "react";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "./AuthModal";
import { TextTranslateUserContentParams, TextTranslateUserContentResponse } from "@/types/types.translation";
import { useTranslationStore } from "@/store/translationStore";
import { translateUserContent } from "@/services/translationService";

const TextTranslationCard = () => {
  const [textValue, setTextValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { languageId, setLanguageId, token } = useAuthStore();
  const { setOriginalText, setTranslatedText, originalText, translatedText } =
    useTranslationStore();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
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
      console.log(languageId, "languageId");
      const params: TextTranslateUserContentParams = {
        Description: textValue,
        LanguageId: languageId ?? 0,
        SourceLanguageId: 2,
        IsPdf: false,
      };
      setOriginalText(textValue);
      const result: TextTranslateUserContentResponse = await translateUserContent(params);
      setTranslatedText(result.text);
    } catch (err) {
      console.log(err);
      setFormError("თარგმნის დროს დაფიქსირდა შეცდომა");
    } finally {
      setTextLoading(false);
    }
  };

  return (
    <TabsContent value="text">
      <div className={translatedText ? "flex gap-8" : undefined}>
        <Card className="border-none flex-1 min-w-0">
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
            <form
              onSubmit={handleSubmit}
              className={translatedText ? "flex-1" : undefined}
            >
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
                onKeyDown={(e) => {
                  if (e.shiftKey && e.key === "Enter") {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) {
                      form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                    }
                  }
                }}
              />
              <Button
                className="w-full text-white suliko-default-bg hover:opacity-90 transition-opacity"
                size="lg"
                type="submit"
                disabled={
                  textLoading || (!!originalText && textValue.trim() === originalText.trim())
                }
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
          </CardContent>
        </Card>
        {translatedText && (
          <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[150px] overflow-auto shadow-sm">
            <div className="font-semibold mb-2 text-suliko-default-color">
              თარგმნილი ტექსტი
            </div>
            <div className="whitespace-pre-line text-foreground">
              {translatedText}
            </div>
          </div>
        )}
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </TabsContent>
  );
};

export default TextTranslationCard;
