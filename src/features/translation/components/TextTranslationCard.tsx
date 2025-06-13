"use client";
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/features/ui/components/ui/card";
import { Type } from "lucide-react";
import { Textarea } from "@/features/ui/components/ui/textarea";
import LanguageSelectionPanel from "./LanguageSelectionPanel";
import TranslationSubmitButton from "./TranslationSubmitButton";
import CopyButton from "./CopyButton";
import { useAuthStore } from "@/features/auth/store/authStore";
import { AuthModal } from "@/features/auth";
import {
  TextTranslateUserContentParams,
  TextTranslateUserContentResponse,
} from "@/features/translation/types/types.Translation";
import { useTextTranslationStore } from "@/features/translation/store/textTranslationStore";
import { translateUserContent } from "@/features/translation/services/translationService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

const textTranslationSchema = z.object({
  currentTextValue: z
    .string()
    .min(1, "გთხოვთ, შეიყვანოთ ტექსტი თარგმნისთვის.")
    .trim(),
  currentTargetLanguageId: z
    .number()
    .min(0, "გთხოვთ, აირჩიეთ სამიზნე ენა"),
  currentSourceLanguageId: z
    .number()
    .min(0, "გთხოვთ, აირჩიეთ წყარო ენა"),
});

type FormData = z.infer<typeof textTranslationSchema>;

const TextTranslationCard = () => {
  const t = useTranslations('TextTranslationCard');
  const [textLoading, setTextLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { token } = useAuthStore();
  const {
    setCurrentTextValue,
    setOriginalText,
    setTranslatedText,
    originalText,
    translatedText,
    currentTextValue,
    currentTargetLanguageId,
    originalTargetLanguageId,
    currentSourceLanguageId,
    sourceLanguageId,
    setCurrentSourceLanguageId,
    setCurrentTargetLanguageId,
    setOriginalTargetLanguageId,
    setSourceLanguageId,
  } = useTextTranslationStore();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(textTranslationSchema),
    defaultValues: {
      currentTextValue,
      currentTargetLanguageId,
      currentSourceLanguageId,
    },
  });
  
  useEffect(() => {
    setValue("currentTextValue", currentTextValue);
    setValue("currentTargetLanguageId", currentTargetLanguageId);
    setValue("currentSourceLanguageId", currentSourceLanguageId);
  }, [currentTextValue, currentTargetLanguageId, currentSourceLanguageId, setValue]);

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

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    setTextLoading(true);
    try {
      const params: TextTranslateUserContentParams = {
        UserText: data.currentTextValue,
        LanguageId: data.currentTargetLanguageId,
        SourceLanguageId: data.currentSourceLanguageId === 0 ? 2 : data.currentSourceLanguageId,
      };
      setOriginalText(data.currentTextValue);
      setOriginalTargetLanguageId(data.currentTargetLanguageId);
      setSourceLanguageId(data.currentSourceLanguageId);
      const result: TextTranslateUserContentResponse =
        await translateUserContent(params);
      setTranslatedText(result.text);
    } catch (err) {
      console.log(err);
    } finally {
      setTextLoading(false);
    }
  };

  const handleFormError = () => {
    if (!token) {
      setShowAuthModal(true);
    }
  };

  const getFormError = () => {
    if (errors.currentTextValue) return errors.currentTextValue.message;
    if (errors.currentTargetLanguageId) return errors.currentTargetLanguageId.message;
    if (errors.currentSourceLanguageId) return errors.currentSourceLanguageId.message;
    return null;
  };

  return (
    <div className={translatedText ? "flex gap-8" : undefined}>
      <Card className="border-none flex-1 min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Type className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, handleFormError)}>
            <LanguageSelectionPanel
              sourceLanguageId={currentSourceLanguageId}
              targetLanguageId={currentTargetLanguageId}
              onSourceLanguageChange={(value) => {
                setCurrentSourceLanguageId(value);
                setValue("currentSourceLanguageId", value);
                clearErrors("currentSourceLanguageId");
              }}
              onTargetLanguageChange={(value) => {
                setCurrentTargetLanguageId(value);
                setValue("currentTargetLanguageId", value);
                clearErrors("currentTargetLanguageId");
              }}
              layout="horizontal"
              showSwapButton={true}
            />
            <div className={translatedText ? "flex gap-4 md:gap-8 items-end" : undefined}>
              <div className="w-full flex-1 min-w-0">
                <div className="font-semibold mb-2 text-suliko-default-color text-sm md:text-base">
                  {t('yourText')}
                </div>
                <div className="h-[300px] max-h-[300px] flex flex-col overflow-y-auto w-full">
                  <Textarea
                    ref={textareaRef}
                    className="w-full flex-1 border-2 focus:border-suliko-default-color focus:ring-suliko-default-color overflow-y-auto text-sm"
                    placeholder={t('textIputPlaceholder')}
                    value={currentTextValue}
                    onChange={(e) => {
                      setCurrentTextValue(e.target.value);
                      setValue("currentTextValue", e.target.value);
                      clearErrors("currentTextValue");
                    }}
                    onKeyDown={(e) => {
                      if (e.shiftKey && e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit(onSubmit, handleFormError)();
                      }
                    }}
                  />
                </div>
              </div>
              {translatedText && (
                <div className="w-full flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-suliko-default-color text-sm md:text-base">
                      {t('result')}
                    </div>
                    <CopyButton 
                      content={translatedText}
                      size="sm"
                      variant="outline"
                    />
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
            <TranslationSubmitButton
              isLoading={textLoading}
              hasResult={!!translatedText}
              disabled={
                textLoading ||
                (!!originalText &&
                  currentTextValue.trim() === originalText.trim() &&
                  currentTargetLanguageId === originalTargetLanguageId &&
                  currentSourceLanguageId === sourceLanguageId)
              }
              formError={getFormError()}
              onClick={(e) => {
                if (!token) {
                  e.preventDefault();
                  setShowAuthModal(true);
                }
              }}
            />
          </form>
        </CardContent>
      </Card>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default TextTranslationCard;
