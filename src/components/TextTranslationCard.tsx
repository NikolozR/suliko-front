"use client";
import { FormEvent, useState, useRef, useEffect } from "react";
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
import {
  TextTranslateUserContentParams,
  TextTranslateUserContentResponse,
} from "@/types/types.Translation";
import { useTranslationStore } from "@/store/translationStore";
import { translateUserContent } from "@/services/translationService";

const TextTranslationCard = () => {
  const [textValue, setTextValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    targetLanguageId,
    sourceLanguageId,
    setTargetLanguageId,
    setSourceLanguageId,
    token,
  } = useAuthStore();
  const { setOriginalText, setTranslatedText, originalText, translatedText } =
    useTranslationStore();
  const [lastTargetLanguageId, setLastTargetLanguageId] = useState<
    number | null
  >(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const translatedRef = useRef<HTMLDivElement | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    const translated = translatedRef.current?.querySelector("div:last-child");
    if (!textarea || !translated || !translatedText) return;

    const syncScroll = (source: Element, target: Element, event: Event) => {
      if (isScrolling.current) return;
      event.preventDefault();

      isScrolling.current = true;
      requestAnimationFrame(() => {
        const sourceScrollPercent =
          source.scrollTop / (source.scrollHeight - source.clientHeight);
        const targetScrollMax = target.scrollHeight - target.clientHeight;
        target.scrollTop = sourceScrollPercent * targetScrollMax;
        isScrolling.current = false;
      });
    };

    const handleTextareaScroll = (e: Event) =>
      syncScroll(textarea, translated, e);
    const handleTranslatedScroll = (e: Event) =>
      syncScroll(translated, textarea, e);

    textarea.addEventListener("scroll", handleTextareaScroll);
    translated.addEventListener("scroll", handleTranslatedScroll);

    return () => {
      textarea.removeEventListener("scroll", handleTextareaScroll);
      translated.removeEventListener("scroll", handleTranslatedScroll);
    };
  }, [translatedText]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    if (targetLanguageId < 0 || sourceLanguageId < 0) {
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
      const params: TextTranslateUserContentParams = {
        Description: textValue,
        LanguageId: targetLanguageId ?? 0,
        SourceLanguageId: sourceLanguageId === 0 ? 2 : sourceLanguageId,
        IsPdf: false,
      };
      setOriginalText(textValue);
      setLastTargetLanguageId(targetLanguageId);
      const result: TextTranslateUserContentResponse =
        await translateUserContent(params);
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
              აკრიფე ტექსტი
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              აკრიფე ტექსტი ანალიზისთვის
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2 md:gap-4 items-end flex-col md:flex-row">
                <div className="w-full md:flex-1 min-w-0">
                  <div className={`flex gap-2 md:gap-4 ${translatedText ? "flex-col sm:flex-row md:flex-col" : "flex-col sm:flex-row"}`}>
                    <div className="w-full sm:flex-1">
                      <span className="block text-xs text-muted-foreground mb-1">
                        რა ენაზე გსურთ თარგმნა?
                      </span>
                      <LanguageSelect
                        value={targetLanguageId}
                        onChange={setTargetLanguageId}
                        placeholder="აირჩიე ენა"
                      />
                    </div>
                    <div className="w-full sm:flex-1">
                      <span className="block text-xs text-muted-foreground mb-1">
                        რა ენაზეა ტექსტი?
                      </span>
                      <LanguageSelect
                        value={sourceLanguageId}
                        onChange={setSourceLanguageId}
                        placeholder="აირჩიე ენა"
                        detectOption="ავტომატური დაფიქსირება"
                      />
                    </div>
                  </div>
                  <div className={"mt-4 h-[300px] max-h-[300px] flex flex-col overflow-y-auto w-full " + (translatedText ? "md:flex-1" : "")}>
                    <Textarea
                      ref={textareaRef}
                      className="w-full flex-1 border-2 focus:border-suliko-default-color focus:ring-suliko-default-color overflow-y-auto text-sm"
                      placeholder="იყო და არა იყო რა..."
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.shiftKey && e.key === "Enter") {
                          e.preventDefault();
                          const form = e.currentTarget.form;
                          if (form) {
                            form.dispatchEvent(
                              new Event("submit", {
                                cancelable: true,
                                bubbles: true,
                              })
                            );
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                {translatedText && (
                  <div className="w-full md:flex-1 min-w-0">
                    <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
                      თარგმნილი ტექსტი
                    </div>
                    <div
                      ref={translatedRef}
                      className="w-full flex-1 px-2 py-2 md:px-3 h-[300px] max-h-[300px] bg-slate-50 dark:bg-input/30 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm flex flex-col"
                    >
                      <div className="text-foreground flex-1 overflow-y-auto text-sm md:text-base">
                        {translatedText}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button
                className="w-full mt-4 text-white suliko-default-bg hover:opacity-90 transition-opacity text-sm md:text-base"
                size={translatedText ? "default" : "lg"}
                type="submit"
                disabled={
                  textLoading ||
                  (!!originalText &&
                    textValue.trim() === originalText.trim() &&
                    lastTargetLanguageId === targetLanguageId)
                }
                onClick={(e) => {
                  if (!token) {
                    e.preventDefault();
                    setShowAuthModal(true);
                  }
                }}
              >
                <span className="text-sm md:text-base">
                  {textLoading ? "მუშავდება..." : "თარგმნე"}
                </span>
              </Button>
              {formError && (
                <div className="text-red-500 text-sm mt-2">{formError}</div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </TabsContent>
  );
};

export default TextTranslationCard;
